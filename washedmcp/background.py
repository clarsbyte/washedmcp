"""
Background Job Support Module - Queue-based async job management.

Provides background job execution with status tracking, cancellation support,
and progress reporting for long-running indexing operations.
"""

import asyncio
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional
from enum import Enum
import threading
from concurrent.futures import ThreadPoolExecutor

from .logging_config import get_logger

logger = get_logger(__name__)


class JobStatus(Enum):
    """Status states for background jobs."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETE = "complete"
    ERROR = "error"
    CANCELLED = "cancelled"


@dataclass
class JobInfo:
    """Information about a background job."""
    job_id: str
    job_type: str
    status: JobStatus = JobStatus.PENDING
    progress: float = 0.0
    phase: str = ""
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    # Detailed progress info
    files_processed: int = 0
    total_files: int = 0
    functions_found: int = 0
    current_file: str = ""
    # For cancellation
    _task: Optional[asyncio.Task] = field(default=None, repr=False)
    _cancelled: bool = field(default=False, repr=False)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "job_id": self.job_id,
            "job_type": self.job_type,
            "status": self.status.value,
            "progress": round(self.progress, 4),
            "phase": self.phase,
            "result": self.result,
            "error": self.error,
            "created_at": self.created_at,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "files_processed": self.files_processed,
            "total_files": self.total_files,
            "functions_found": self.functions_found,
            "current_file": self.current_file,
            "elapsed_seconds": self._elapsed_time(),
        }

    def _elapsed_time(self) -> float:
        """Calculate elapsed time."""
        if self.started_at is None:
            return 0.0
        end_time = self.completed_at or time.time()
        return round(end_time - self.started_at, 2)

    def is_terminal(self) -> bool:
        """Check if job is in a terminal state."""
        return self.status in (JobStatus.COMPLETE, JobStatus.ERROR, JobStatus.CANCELLED)


class BackgroundJobManager:
    """
    Manager for background indexing jobs.

    Provides:
    - Job queuing and execution
    - Status tracking
    - Progress reporting
    - Cancellation support
    - Job history
    """

    def __init__(self, max_concurrent_jobs: int = 1, max_history: int = 100):
        """
        Initialize the job manager.

        Args:
            max_concurrent_jobs: Maximum jobs to run concurrently
            max_history: Maximum completed jobs to keep in history
        """
        self._jobs: Dict[str, JobInfo] = {}
        self._job_queue: asyncio.Queue = None  # Initialized lazily
        self._max_concurrent = max_concurrent_jobs
        self._max_history = max_history
        self._running_count = 0
        self._lock = asyncio.Lock()
        self._worker_task: Optional[asyncio.Task] = None
        self._started = False

    async def _ensure_started(self):
        """Ensure the job manager is started."""
        if not self._started:
            self._job_queue = asyncio.Queue()
            self._worker_task = asyncio.create_task(self._worker_loop())
            self._started = True

    async def _worker_loop(self):
        """Background worker that processes queued jobs."""
        while True:
            try:
                # Wait for a job
                job_id = await self._job_queue.get()

                if job_id is None:
                    # Shutdown signal
                    break

                job = self._jobs.get(job_id)
                if job is None or job._cancelled:
                    self._job_queue.task_done()
                    continue

                # Run the job
                await self._execute_job(job)
                self._job_queue.task_done()

            except asyncio.CancelledError:
                break
            except Exception as e:
                # Log error but keep worker running
                logger.exception("Error in background worker loop")

    async def _execute_job(self, job: JobInfo):
        """Execute a single job."""
        async with self._lock:
            self._running_count += 1

        job.status = JobStatus.RUNNING
        job.started_at = time.time()
        logger.debug("Starting job %s (type: %s)", job.job_id, job.job_type)

        try:
            if job.job_type == "index_codebase":
                await self._run_index_job(job)
            else:
                raise ValueError(f"Unknown job type: {job.job_type}")

        except asyncio.CancelledError:
            logger.warning("Job %s was cancelled", job.job_id)
            job.status = JobStatus.CANCELLED
            job.error = "Job was cancelled"
        except Exception as e:
            logger.exception("Job %s failed with error", job.job_id)
            job.status = JobStatus.ERROR
            job.error = str(e)
        finally:
            job.completed_at = time.time()
            logger.info("Job %s completed with status: %s", job.job_id, job.status.value)
            async with self._lock:
                self._running_count -= 1
            # Clean up old jobs
            await self._cleanup_history()

    async def _run_index_job(self, job: JobInfo):
        """Execute an indexing job."""
        from .async_indexer import index_codebase_async, IndexProgress

        # Extract job parameters
        params = job.result or {}
        path = params.get("path", "")
        persist_path = params.get("persist_path")
        skip_summarize = params.get("skip_summarize", True)

        def progress_callback(progress: IndexProgress):
            """Update job with progress info."""
            if job._cancelled:
                raise asyncio.CancelledError()

            job.progress = progress.progress
            job.phase = progress.phase
            job.files_processed = progress.files_processed
            job.total_files = progress.total_files
            job.functions_found = progress.functions_found
            job.current_file = progress.current_file

        # Create task for cancellation support
        task = asyncio.current_task()
        job._task = task

        try:
            result = await index_codebase_async(
                path=path,
                persist_path=persist_path,
                skip_summarize=skip_summarize,
                progress_callback=progress_callback,
            )

            if job._cancelled:
                job.status = JobStatus.CANCELLED
                job.error = "Job was cancelled"
            elif result.get("status") == "success":
                job.status = JobStatus.COMPLETE
                job.result = result
                job.progress = 1.0
            else:
                job.status = JobStatus.ERROR
                job.error = result.get("error", "Unknown error")
                job.result = result

        except asyncio.CancelledError:
            job.status = JobStatus.CANCELLED
            job.error = "Job was cancelled"
            raise

    async def _cleanup_history(self):
        """Remove old completed jobs if we exceed max_history."""
        async with self._lock:
            completed_jobs = [
                j for j in self._jobs.values()
                if j.is_terminal()
            ]

            if len(completed_jobs) > self._max_history:
                # Sort by completion time and remove oldest
                completed_jobs.sort(key=lambda j: j.completed_at or 0)
                to_remove = completed_jobs[:-self._max_history]
                for job in to_remove:
                    del self._jobs[job.job_id]

    async def submit_job(
        self,
        job_type: str,
        params: Dict[str, Any],
    ) -> str:
        """
        Submit a new background job.

        Args:
            job_type: Type of job (e.g., "index_codebase")
            params: Job parameters

        Returns:
            Job ID for status tracking
        """
        await self._ensure_started()

        job_id = str(uuid.uuid4())[:8]

        job = JobInfo(
            job_id=job_id,
            job_type=job_type,
            result=params,  # Store params in result initially
        )

        self._jobs[job_id] = job
        await self._job_queue.put(job_id)

        logger.info("Submitted background job %s (type: %s)", job_id, job_type)
        return job_id

    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the status of a job.

        Args:
            job_id: The job ID to check

        Returns:
            Job status dictionary or None if not found
        """
        job = self._jobs.get(job_id)
        if job is None:
            return None
        return job.to_dict()

    async def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a running or pending job.

        Args:
            job_id: The job ID to cancel

        Returns:
            True if job was cancelled, False if not found or already complete
        """
        job = self._jobs.get(job_id)
        if job is None:
            return False

        if job.is_terminal():
            return False

        job._cancelled = True

        if job._task and not job._task.done():
            job._task.cancel()

        job.status = JobStatus.CANCELLED
        job.error = "Job was cancelled"
        job.completed_at = time.time()

        return True

    async def list_jobs(
        self,
        status_filter: Optional[JobStatus] = None,
        job_type_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        List all jobs, optionally filtered.

        Args:
            status_filter: Only return jobs with this status
            job_type_filter: Only return jobs of this type

        Returns:
            List of job status dictionaries
        """
        jobs = list(self._jobs.values())

        if status_filter:
            jobs = [j for j in jobs if j.status == status_filter]

        if job_type_filter:
            jobs = [j for j in jobs if j.job_type == job_type_filter]

        # Sort by creation time, most recent first
        jobs.sort(key=lambda j: j.created_at, reverse=True)

        return [j.to_dict() for j in jobs]

    async def get_active_index_job(self) -> Optional[Dict[str, Any]]:
        """
        Get the currently active indexing job, if any.

        Returns:
            Active job status or None
        """
        for job in self._jobs.values():
            if job.job_type == "index_codebase" and not job.is_terminal():
                return job.to_dict()
        return None

    async def shutdown(self):
        """Shutdown the job manager."""
        if self._worker_task:
            # Cancel all running jobs
            for job in self._jobs.values():
                if not job.is_terminal():
                    await self.cancel_job(job.job_id)

            # Signal worker to stop
            if self._job_queue:
                await self._job_queue.put(None)

            # Wait for worker to finish
            try:
                await asyncio.wait_for(self._worker_task, timeout=5.0)
            except asyncio.TimeoutError:
                self._worker_task.cancel()

            self._started = False


# Global job manager instance
_job_manager: Optional[BackgroundJobManager] = None


def get_job_manager() -> BackgroundJobManager:
    """Get or create the global job manager."""
    global _job_manager
    if _job_manager is None:
        _job_manager = BackgroundJobManager()
    return _job_manager


async def submit_index_job(
    path: str,
    persist_path: Optional[str] = None,
    skip_summarize: bool = True,
) -> str:
    """
    Submit a background indexing job.

    Args:
        path: Path to codebase to index
        persist_path: Optional database path
        skip_summarize: Skip summarization step

    Returns:
        Job ID for tracking
    """
    manager = get_job_manager()
    return await manager.submit_job(
        job_type="index_codebase",
        params={
            "path": path,
            "persist_path": persist_path,
            "skip_summarize": skip_summarize,
        },
    )


async def get_index_job_status(job_id: str) -> Optional[Dict[str, Any]]:
    """
    Get status of an indexing job.

    Args:
        job_id: Job ID to check

    Returns:
        Job status or None
    """
    manager = get_job_manager()
    return await manager.get_job_status(job_id)


async def cancel_index_job(job_id: str) -> bool:
    """
    Cancel an indexing job.

    Args:
        job_id: Job ID to cancel

    Returns:
        True if cancelled
    """
    manager = get_job_manager()
    return await manager.cancel_job(job_id)


async def get_active_indexing() -> Optional[Dict[str, Any]]:
    """
    Get currently active indexing job if any.

    Returns:
        Active job status or None
    """
    manager = get_job_manager()
    return await manager.get_active_index_job()


if __name__ == "__main__":
    import sys
    import os

    async def test_background_jobs():
        """Test background job functionality."""
        print("=" * 60)
        print("BACKGROUND JOB MANAGER TEST")
        print("=" * 60)

        # Get test path
        if len(sys.argv) > 1:
            test_path = sys.argv[1]
        else:
            test_path = os.path.join(
                os.path.dirname(__file__), "..", "tests", "test_codebase"
            )

        print(f"\nSubmitting indexing job for: {test_path}")

        # Submit job
        job_id = await submit_index_job(test_path)
        print(f"Job ID: {job_id}")

        # Poll for status
        print("\nPolling status...")
        while True:
            status = await get_index_job_status(job_id)
            if status is None:
                print("Job not found!")
                break

            print(f"\r[{status['phase']:20}] {status['progress']*100:5.1f}% | "
                  f"Files: {status['files_processed']}/{status['total_files']} | "
                  f"Functions: {status['functions_found']} | "
                  f"Status: {status['status']}", end="", flush=True)

            if status['status'] in ('complete', 'error', 'cancelled'):
                print()  # New line
                break

            await asyncio.sleep(0.5)

        # Print final result
        print("\n" + "=" * 60)
        print("FINAL STATUS")
        print("=" * 60)
        final_status = await get_index_job_status(job_id)
        if final_status:
            for key, value in final_status.items():
                print(f"  {key}: {value}")

        # Cleanup
        manager = get_job_manager()
        await manager.shutdown()

    asyncio.run(test_background_jobs())

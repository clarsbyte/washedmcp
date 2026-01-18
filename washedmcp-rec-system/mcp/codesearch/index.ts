import { Tool, Resource, SchemaConstraint, Optional } from "@leanmcp/core";
import { spawn } from "child_process";
import * as path from "path";

/**
 * WashedMCP Code Search Service
 *
 * Provides semantic code search to reduce token usage by ~70%
 * Uses vector embeddings to find code by meaning, not just name
 */

// Path to our Python CLI
const CLI_PATH = path.join(__dirname, "../../../src/cli.py");

// Helper to run Python CLI commands
async function runPythonCLI(args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn("python3", [CLI_PATH, ...args], {
      cwd: path.join(__dirname, "../../.."),
      env: { ...process.env }
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        // Try to parse error from stdout first (our CLI outputs JSON)
        try {
          const result = JSON.parse(stdout);
          if (result.status === "error") {
            resolve(result);
            return;
          }
        } catch {}
        reject(new Error(`Python CLI exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        reject(new Error(`Failed to parse CLI output: ${stdout}`));
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

// Input schemas
class IndexInput {
  @SchemaConstraint({
    description: "Absolute path to the codebase directory to index"
  })
  path!: string;

  @Optional()
  @SchemaConstraint({
    description: "Skip generating summaries (faster indexing)",
    default: false
  })
  skip_summarize?: boolean;
}

class SearchInput {
  @SchemaConstraint({
    description: "Natural language description of what code you're looking for. Examples: 'palindrome function', 'email validation', 'user authentication'"
  })
  query!: string;

  @Optional()
  @SchemaConstraint({
    description: "Number of results to return",
    default: 5,
    minimum: 1,
    maximum: 20
  })
  top_k?: number;

  @Optional()
  @SchemaConstraint({
    description: "Output format: 'toon' (token-optimized) or 'json'",
    enum: ["toon", "json"],
    default: "toon"
  })
  format?: string;
}

export class CodeSearchService {
  @Tool({
    description: "Index a codebase for semantic search. Run this once when opening a new project. Creates embeddings for all functions so they can be found by meaning.",
    inputClass: IndexInput
  })
  async index_codebase(input: IndexInput) {
    const args = ["index", input.path];
    if (input.skip_summarize) {
      args.push("--skip-summarize");
    }

    const result = await runPythonCLI(args);

    return {
      content: [{
        type: "text" as const,
        text: result.status === "success"
          ? `✓ Indexed ${result.functions_indexed} functions from ${result.files_processed} files in ${result.path}`
          : `✗ Error: ${result.error}`
      }]
    };
  }

  @Tool({
    description: "ALWAYS use this FIRST when user asks about code, bugs, functions, or features. Searches indexed codebase by MEANING, not just name. Returns exact file:line locations. Example: searching 'palindrome' finds 'checkReverse' function. Saves thousands of tokens vs manual searching.",
    inputClass: SearchInput
  })
  async search_code(input: SearchInput) {
    const args = ["search", input.query];

    if (input.top_k) {
      args.push("--top-k", String(input.top_k));
    }
    if (input.format) {
      args.push("--format", input.format);
    }

    const result = await runPythonCLI(args);

    if (result.status === "error") {
      return {
        content: [{
          type: "text" as const,
          text: `✗ Search error: ${result.error}`
        }]
      };
    }

    // Return TOON formatted results for maximum token savings
    return {
      content: [{
        type: "text" as const,
        text: result.formatted
      }]
    };
  }

  @Resource({
    description: "Get indexing status and statistics"
  })
  async index_status() {
    const result = await runPythonCLI(["status"]);

    return {
      contents: [{
        uri: "codesearch://status",
        mimeType: "application/json",
        text: JSON.stringify({
          indexed: result.indexed,
          total_functions: result.total_functions,
          status: result.status
        }, null, 2)
      }]
    };
  }
}

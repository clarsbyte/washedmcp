/**
 * Neo4j Driver Stub
 *
 * Neo4j has been disabled in favor of the dummy data layer.
 * This file exports stubs that warn when called and return empty/false values.
 * Kept for backwards compatibility - will be removed in future versions.
 *
 * For data access, use @/lib/data instead.
 */

const DEPRECATION_WARNING = '[Neo4j DISABLED] Neo4j is disabled. Use @/lib/data for data access.';

/**
 * Stub driver that does nothing
 */
const stubDriver = {
  session: () => {
    console.warn(DEPRECATION_WARNING);
    return {
      run: async () => ({ records: [] }),
      close: async () => {},
    };
  },
  close: async () => {
    console.warn(DEPRECATION_WARNING);
  },
};

/**
 * Verify database connectivity - always returns false (disabled)
 */
export async function verifyConnection(): Promise<boolean> {
  console.warn(DEPRECATION_WARNING);
  return false;
}

/**
 * Get a new session - returns stub session (disabled)
 */
export function getSession() {
  console.warn(DEPRECATION_WARNING);
  return stubDriver.session();
}

/**
 * Execute a read query - returns empty array (disabled)
 */
export async function executeRead<T>(
  _query: string,
  _params?: Record<string, unknown>
): Promise<T[]> {
  console.warn(DEPRECATION_WARNING);
  return [];
}

/**
 * Execute a write query - returns empty array (disabled)
 */
export async function executeWrite<T>(
  _query: string,
  _params?: Record<string, unknown>
): Promise<T[]> {
  console.warn(DEPRECATION_WARNING);
  return [];
}

/**
 * Close the driver connection - no-op (disabled)
 */
export async function closeConnection(): Promise<void> {
  console.warn(DEPRECATION_WARNING);
}

// Export alias for backwards compatibility
export { executeRead as executeReadQuery };

// Export stub driver as default
export default stubDriver;

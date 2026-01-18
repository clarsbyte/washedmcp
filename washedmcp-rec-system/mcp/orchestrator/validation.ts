/**
 * Token Validation Module
 * Validates API token formats for common services
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  varName: string;
  message: string;
  hint?: string;
}

export interface ValidationWarning {
  varName: string;
  message: string;
}

/**
 * Token format patterns for common API credentials
 * These patterns validate the format, not the actual validity of tokens
 */
export const TOKEN_PATTERNS: Record<string, RegExp> = {
  // GitHub tokens
  GITHUB_PERSONAL_ACCESS_TOKEN: /^(gh[ps]_[A-Za-z0-9_]{36,}|github_pat_[A-Za-z0-9_]{22,})$/,
  GITHUB_TOKEN: /^(gh[ps]_[A-Za-z0-9_]{36,}|github_pat_[A-Za-z0-9_]{22,})$/,

  // Slack tokens
  SLACK_BOT_TOKEN: /^xoxb-[0-9]+-[0-9]+-[A-Za-z0-9]+$/,
  SLACK_TOKEN: /^xox[abp]-[0-9]+-[0-9A-Za-z-]+$/,
  SLACK_APP_TOKEN: /^xapp-[0-9]+-[A-Za-z0-9-]+$/,

  // OpenAI
  OPENAI_API_KEY: /^sk-[A-Za-z0-9]{32,}$/,

  // Anthropic
  ANTHROPIC_API_KEY: /^sk-ant-[A-Za-z0-9-_]{32,}$/,

  // Google/Gemini
  GEMINI_API_KEY: /^AIza[A-Za-z0-9_-]{35}$/,
  GOOGLE_API_KEY: /^AIza[A-Za-z0-9_-]{35}$/,

  // AWS
  AWS_ACCESS_KEY_ID: /^AKIA[A-Z0-9]{16}$/,
  AWS_SECRET_ACCESS_KEY: /^[A-Za-z0-9/+=]{40}$/,

  // Linear
  LINEAR_API_KEY: /^lin_api_[A-Za-z0-9]{32,}$/,

  // Notion
  NOTION_API_KEY: /^(secret_|ntn_)[A-Za-z0-9]{43,}$/,
  NOTION_TOKEN: /^(secret_|ntn_)[A-Za-z0-9]{43,}$/,

  // Todoist
  TODOIST_API_TOKEN: /^[a-f0-9]{40}$/,
  TODOIST_API_KEY: /^[a-f0-9]{40}$/,

  // Supabase
  SUPABASE_KEY: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,

  // Trello
  TRELLO_API_KEY: /^[a-f0-9]{32}$/,
  TRELLO_TOKEN: /^[a-f0-9]{64}$/,

  // Asana
  ASANA_TOKEN: /^[0-9]\/[0-9]+:[A-Za-z0-9]+$/,

  // Firebase
  FIREBASE_PROJECT_ID: /^[a-z0-9-]{6,30}$/,

  // Generic patterns for common naming conventions
  API_KEY: /^.{20,}$/,
  API_TOKEN: /^.{20,}$/,
  SECRET_KEY: /^.{20,}$/,
  ACCESS_TOKEN: /^.{20,}$/,
};

/**
 * Format hints for common token types
 */
export const TOKEN_FORMAT_HINTS: Record<string, string> = {
  GITHUB_PERSONAL_ACCESS_TOKEN: "GitHub tokens start with 'ghp_' or 'ghs_' (e.g., ghp_xxxxxxxxxxxx)",
  GITHUB_TOKEN: "GitHub tokens start with 'ghp_' or 'ghs_' (e.g., ghp_xxxxxxxxxxxx)",
  SLACK_BOT_TOKEN: "Slack bot tokens start with 'xoxb-' (e.g., xoxb-123-456-abc)",
  SLACK_TOKEN: "Slack tokens start with 'xoxb-', 'xoxa-', or 'xoxp-'",
  OPENAI_API_KEY: "OpenAI API keys start with 'sk-' (e.g., sk-xxxxxxxxxxxx)",
  ANTHROPIC_API_KEY: "Anthropic API keys start with 'sk-ant-'",
  GEMINI_API_KEY: "Gemini API keys start with 'AIza'",
  GOOGLE_API_KEY: "Google API keys start with 'AIza'",
  AWS_ACCESS_KEY_ID: "AWS Access Key IDs start with 'AKIA' and are 20 characters",
  AWS_SECRET_ACCESS_KEY: "AWS Secret Access Keys are 40 characters of alphanumeric and special chars",
  LINEAR_API_KEY: "Linear API keys start with 'lin_api_'",
  NOTION_API_KEY: "Notion API keys start with 'secret_' or 'ntn_'",
  NOTION_TOKEN: "Notion tokens start with 'secret_' or 'ntn_'",
  TODOIST_API_TOKEN: "Todoist API tokens are 40-character hexadecimal strings",
  SUPABASE_KEY: "Supabase keys are JWT tokens (eyJ...)",
};

/**
 * Get format hint for a variable name
 */
export function getTokenFormatHint(varName: string): string {
  // First try exact match
  if (TOKEN_FORMAT_HINTS[varName]) {
    return TOKEN_FORMAT_HINTS[varName];
  }

  // Try normalized name (uppercase with underscores)
  const normalized = varName.toUpperCase().replace(/-/g, "_");
  if (TOKEN_FORMAT_HINTS[normalized]) {
    return TOKEN_FORMAT_HINTS[normalized];
  }

  // Try to infer from variable name
  const nameLower = varName.toLowerCase();

  if (nameLower.includes("github")) {
    return TOKEN_FORMAT_HINTS.GITHUB_PERSONAL_ACCESS_TOKEN;
  }
  if (nameLower.includes("slack")) {
    return TOKEN_FORMAT_HINTS.SLACK_BOT_TOKEN;
  }
  if (nameLower.includes("openai")) {
    return TOKEN_FORMAT_HINTS.OPENAI_API_KEY;
  }
  if (nameLower.includes("anthropic")) {
    return TOKEN_FORMAT_HINTS.ANTHROPIC_API_KEY;
  }
  if (nameLower.includes("gemini") || nameLower.includes("google")) {
    return TOKEN_FORMAT_HINTS.GEMINI_API_KEY;
  }
  if (nameLower.includes("aws") && nameLower.includes("access")) {
    return TOKEN_FORMAT_HINTS.AWS_ACCESS_KEY_ID;
  }
  if (nameLower.includes("aws") && nameLower.includes("secret")) {
    return TOKEN_FORMAT_HINTS.AWS_SECRET_ACCESS_KEY;
  }
  if (nameLower.includes("linear")) {
    return TOKEN_FORMAT_HINTS.LINEAR_API_KEY;
  }
  if (nameLower.includes("notion")) {
    return TOKEN_FORMAT_HINTS.NOTION_API_KEY;
  }
  if (nameLower.includes("todoist")) {
    return TOKEN_FORMAT_HINTS.TODOIST_API_TOKEN;
  }
  if (nameLower.includes("supabase")) {
    return TOKEN_FORMAT_HINTS.SUPABASE_KEY;
  }

  // Generic hint
  return `Please provide a valid ${varName}`;
}

/**
 * Validate a single environment variable value
 */
export function validateEnvVar(
  varName: string,
  value: string
): { isValid: boolean; error?: string; warning?: string } {
  // Empty values are always invalid
  if (!value || value.trim() === "") {
    return {
      isValid: false,
      error: `${varName} cannot be empty`
    };
  }

  // Check for placeholder values
  const placeholderPatterns = [
    /^your[_-]?/i,
    /^xxx+$/i,
    /^<.*>$/,
    /^\[.*\]$/,
    /^placeholder$/i,
    /^insert[_-]?/i,
    /^replace[_-]?/i,
  ];

  for (const pattern of placeholderPatterns) {
    if (pattern.test(value)) {
      return {
        isValid: false,
        error: `${varName} appears to be a placeholder value`
      };
    }
  }

  // Get the pattern for this variable
  const pattern = TOKEN_PATTERNS[varName] || TOKEN_PATTERNS[varName.toUpperCase().replace(/-/g, "_")];

  if (!pattern) {
    // No pattern available - accept but warn if it looks suspicious
    if (value.length < 10) {
      return {
        isValid: true,
        warning: `${varName} seems unusually short (${value.length} chars)`
      };
    }
    return { isValid: true };
  }

  // Test against the pattern
  if (!pattern.test(value)) {
    return {
      isValid: false,
      error: `${varName} format appears invalid. ${getTokenFormatHint(varName)}`
    };
  }

  return { isValid: true };
}

/**
 * Validate multiple environment variables
 * Returns errors and warnings but defaults to warn-only mode
 */
export function validateEnvVars(
  envVars: Record<string, string>,
  options: {
    strictMode?: boolean; // If true, treat warnings as errors
  } = {}
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const [varName, value] of Object.entries(envVars)) {
    const result = validateEnvVar(varName, value);

    if (!result.isValid && result.error) {
      if (options.strictMode) {
        errors.push({
          varName,
          message: result.error,
          hint: getTokenFormatHint(varName)
        });
      } else {
        // In warn-only mode (default), format mismatches are warnings
        // This avoids blocking valid tokens from newer API versions
        warnings.push({
          varName,
          message: result.error
        });
      }
    }

    if (result.warning) {
      warnings.push({
        varName,
        message: result.warning
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Quick check if a token looks valid (for UI feedback)
 */
export function isTokenFormatValid(varName: string, value: string): boolean {
  const result = validateEnvVar(varName, value);
  return result.isValid && !result.error;
}

/**
 * Get all known token patterns (for documentation purposes)
 */
export function getKnownTokenPatterns(): string[] {
  return Object.keys(TOKEN_PATTERNS);
}

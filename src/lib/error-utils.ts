/**
 * Utility functions for handling Supabase errors and extracting Request IDs
 */

export interface SupabaseError {
  message?: string;
  context?: {
    requestId?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Extracts Request ID from a Supabase error
 */
export function extractRequestId(error: any): string | null {
  if (!error) return null;

  // Check error.context.requestId
  if (error.context?.requestId) {
    return error.context.requestId;
  }

  // Check if Request ID is in the message (format: "Request ID: xxxxx")
  if (error.message) {
    const requestIdMatch = error.message.match(/Request ID:\s*([a-f0-9-]+)/i);
    if (requestIdMatch) {
      return requestIdMatch[1];
    }
  }

  // Check if there's a UUID pattern in the message
  if (error.message) {
    const uuidMatch = error.message.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (uuidMatch) {
      return uuidMatch[1];
    }
  }

  // Check error object directly for requestId
  if (error.requestId) {
    return error.requestId;
  }

  return null;
}

/**
 * Formats an error message with Request ID for user display
 */
export function formatErrorMessage(error: any, defaultMessage: string = "An error occurred. Please try again."): string {
  const requestId = extractRequestId(error);
  
  if (requestId) {
    return `${defaultMessage} (Request ID: ${requestId})`;
  }
  
  return defaultMessage;
}

/**
 * Logs error with Request ID for debugging
 */
export function logErrorWithRequestId(error: any, context: string = "Error"): void {
  const requestId = extractRequestId(error);
  
  console.error(`${context}:`, error);
  if (requestId) {
    console.error(`${context} Request ID:`, requestId);
  }
  console.error(`${context} Full details:`, JSON.stringify(error, null, 2));
}

/**
 * Checks if error is a connection/network error
 */
/** Map known English edge-function / API error strings to i18n keys in the `common` namespace. */
export function localizeEdgeErrorMessage(
  message: string | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (!message?.trim()) {
    return t("edgeErrors.unknownError");
  }

  const lower = message.toLowerCase();

  if (lower.includes("permission denied")) {
    return t("edgeErrors.permissionDenied");
  }
  if (lower.includes("database error")) {
    return t("edgeErrors.databaseError");
  }
  if (lower.includes("service temporarily unavailable")) {
    return t("edgeErrors.serviceUnavailable");
  }
  if (lower.includes("an error occurred")) {
    return t("edgeErrors.genericRetry");
  }
  if (lower.includes("no character selected")) {
    return t("edgeErrors.noCharacterSelected");
  }
  if (lower.includes("failed to generate message")) {
    return t("edgeErrors.failedToGenerateMessage");
  }
  if (lower.includes("no message generated")) {
    return t("edgeErrors.noMessageGenerated");
  }

  const dailyLimitMatch = message.match(/daily message limit \((\d+) messages\)/i);
  if (dailyLimitMatch) {
    return t("edgeErrors.dailyMessageLimit", { limit: dailyLimitMatch[1] });
  }

  if (lower.includes("unknown error")) {
    return t("edgeErrors.unknownError");
  }
  if (lower.includes("user id and message are required")) {
    return t("edgeErrors.userIdAndMessageRequired");
  }
  if (lower.includes("unauthorized")) {
    return t("edgeErrors.unauthorized");
  }
  if (
    lower.includes("failed to fetch") ||
    lower.includes("network error") ||
    lower.includes("econnrefused") ||
    lower.includes("timeout")
  ) {
    return t("edgeErrors.connectionError");
  }
  if (lower.includes("error. please try again")) {
    return t("edgeErrors.genericRetry");
  }
  if (lower.includes("invalid") && (lower.includes("request") || lower.includes("message"))) {
    return t("edgeErrors.invalidRequest");
  }

  return t("edgeErrors.genericRetry");
}

export function isConnectionError(error: any): boolean {
  if (!error) return false;
  
  const message = (error.message || "").toLowerCase();
  const errorString = JSON.stringify(error).toLowerCase();
  
  return (
    message.includes('connection') ||
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('failed to fetch') ||
    errorString.includes('connection') ||
    errorString.includes('network')
  );
}









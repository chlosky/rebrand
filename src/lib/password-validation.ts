/**
 * Shared password validation utility
 * Used across password reset, signup, and password change flows
 */

export type PasswordValidationErrorKey =
  | "minLength"
  | "lowercase"
  | "uppercase"
  | "digit"
  | "mismatch";

export interface PasswordValidationResult {
  isValid: boolean;
  error: PasswordValidationErrorKey | null;
}

/**
 * Validates a password according to the app's security requirements
 * 
 * Requirements:
 * - Minimum 8 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one digit
 * 
 * @param password - The password to validate
 * @returns Validation result with isValid flag and error message (if invalid)
 */
export function validatePassword(password: string): PasswordValidationResult {
  if (!password) {
    return { isValid: false, error: null }; // Empty password - no error message yet
  }
  
  // Minimum 8 characters
  if (password.length < 8) {
    return { isValid: false, error: "minLength" };
  }
  
  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: "lowercase" };
  }
  
  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "uppercase" };
  }
  
  // At least one digit
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: "digit" };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validates that two passwords match
 * 
 * @param password - The first password
 * @param confirmPassword - The confirmation password
 * @returns Validation result
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): PasswordValidationResult {
  if (!confirmPassword) {
    return { isValid: false, error: null }; // Empty - no error message yet
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: "mismatch" };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validation utility functions for form validation
 */

export interface PasswordStrength {
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
    isValid: boolean;
}

/**
 * Validate if a field is not empty
 */
export const validateRequired = (value: string): boolean => {
    return value.trim().length > 0;
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Check password strength and return detailed requirements
 */
export const checkPasswordStrength = (password: string): PasswordStrength => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return {
        hasUppercase,
        hasLowercase,
        hasNumber,
        hasSymbol,
        isValid: hasUppercase && hasLowercase && hasNumber && hasSymbol && password.length >= 8,
    };
};

/**
 * Validate password meets all requirements
 */
export const validatePassword = (password: string): boolean => {
    const strength = checkPasswordStrength(password);
    return strength.isValid;
};

/**
 * Validate password confirmation matches
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword && password.length > 0;
};

/**
 * Get error message for required field
 */
export const getRequiredError = (fieldName: string): string => {
    return `${fieldName} harus diisi`;
};

/**
 * Get error message for email validation
 */
export const getEmailError = (): string => {
    return 'Format email tidak valid';
};

/**
 * Get error message for password validation
 */
export const getPasswordError = (strength: PasswordStrength): string => {
    const missing: string[] = [];

    if (!strength.hasUppercase) missing.push('huruf besar (A-Z)');
    if (!strength.hasLowercase) missing.push('huruf kecil (a-z)');
    if (!strength.hasNumber) missing.push('angka (0-9)');
    if (!strength.hasSymbol) missing.push('simbol (!@#$%^&*, dll)');

    if (missing.length > 0) {
        return `Password harus mengandung: ${missing.join(', ')}`;
    }

    return 'Password minimal 8 karakter';
};

/**
 * Get error message for password match validation
 */
export const getPasswordMatchError = (): string => {
    return 'Password tidak cocok';
};

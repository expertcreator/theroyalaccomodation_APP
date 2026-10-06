// Shared validators.

/** Basic email shape check. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** True if the value looks like a valid email (trims first). */
export const isValidEmail = (value: string): boolean => EMAIL_RE.test(value.trim());
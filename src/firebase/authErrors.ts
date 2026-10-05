// Turn a Firebase Auth error into a friendly, user-facing message.

export function authErrorMessage(error: unknown): string {
    const code = (error as { code?: string })?.code ?? '';

    switch (code) {
        // --- sign in ---
        case 'auth/invalid-email':
            return 'That email address doesn’t look right.';
        case 'auth/user-disabled':
            return 'This account has been disabled. Please contact us.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': // newer SDKs return this for bad email/pw
            return 'Incorrect email or password.';

        // --- sign up ---
        case 'auth/email-already-in-use':
            return 'An account already exists with this email. Try signing in.';
        case 'auth/weak-password':
            return 'Please choose a stronger password (at least 6 characters).';
        case 'auth/operation-not-allowed':
            return 'Email sign-in isn’t enabled yet. Please try again later.';

        // --- shared ---
        case 'auth/too-many-requests':
            return 'Too many attempts. Please wait a moment and try again.';
        case 'auth/network-request-failed':
            return 'Network error. Check your connection and try again.';

        default:
            return 'Something went wrong. Please try again.';
    }
}
/**
 * Compare two app versions like "1.0", "1.2.3" or "2".
 * Returns -1 if a is older than b, 0 if they're the same, 1 if a is newer.
 *
 * Missing parts count as 0, so "1.0" and "1.0.0" are the same.
 * Anything that isn't a number counts as 0 too, so a bad value never throws.
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
    const pa = a.split('.').map(toNumber);
    const pb = b.split('.').map(toNumber);
    const length = Math.max(pa.length, pb.length);

    for (let i = 0; i < length; i++) {
        const x = pa[i] ?? 0;
        const y = pb[i] ?? 0;
        if (x > y) return 1;
        if (x < y) return -1;
    }
    return 0;
}

/** The first number of a version: "2.1.0" → 2. */
export function majorOf(version: string): number {
    return toNumber(version.split('.')[0] ?? '0');
}

/**
 * Android versionCode → version name, using our rule:
 *   versionCode = major × 10000 + minor × 100 + patch
 *   10100 → "1.1",  10203 → "1.2.3",  20000 → "2.0"
 *
 * Google Play only tells the app the new versionCode, so this is how the app
 * knows whether an Android update is a new major version (forced) or not.
 * Codes below 10000 (like the first upload, versionCode 1) don't follow the
 * rule, so they give undefined — treated as an optional update.
 */
export function versionFromCode(code: number | undefined): string | undefined {
    if (!code || code < 10000) return undefined;
    const major = Math.floor(code / 10000);
    const minor = Math.floor(code / 100) % 100;
    const patch = code % 100;
    return patch ? `${major}.${minor}.${patch}` : `${major}.${minor}`;
}

function toNumber(part: string): number {
    const n = parseInt(part, 10);
    return Number.isFinite(n) ? n : 0;
}

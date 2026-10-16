// Release builds: switch off console output (APP-10).
//
// In a release build, console output goes to the phone's system log, where
// anyone with the phone plugged in (and some Android apps) can read it. Ours
// includes guests' names, emails and phones, the Stripe payment secret, and
// sign-in tokens inside request errors. Nothing collects these logs in release
// (no crash reporting), so we drop them.
//
// Debug builds (__DEV__) log exactly as before, so Metro still shows everything.
// Imported first in index.js, so it runs before any other code can log.

if (!__DEV__) {
    const doNothing = () => {};
    console.log = doNothing;
    console.info = doNothing;
    console.debug = doNothing;
    console.warn = doNothing;
    console.error = doNothing;
}

export {};

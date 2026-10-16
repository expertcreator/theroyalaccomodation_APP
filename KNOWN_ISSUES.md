# Known Issues

Bugs and risks found during the code review on 2026-10-14. They're deferred to fix later and ordered by priority within each section. Tick an item off (`[x]`) when it's fixed.

IDs: `APP-n` = this repo, `PLG-n` = the RA App API WordPress plugin (not in this repo), `TOOL-n` = tooling.

## App — high

- [x] **APP-1 · Back-to-back stays can't be booked.** `src/components/Calendar/Calendar.tsx:44` disables every occupied day (`disabled = isOccupied || isPast`). If another guest arrives on the 15th, you can't pick the 15th as your check-out, although that's a valid turnover day: the plugin treats nights as `[check_in, check_out)`, and `handleSelectDay` would accept the date. Bookings are being lost.
  *Confirmed in the iOS simulator (2026-10-14):* Ascot is booked from 16 Oct. With check-in on 14 Oct, tapping 16 Oct does nothing. Because of the 2-night minimum, the nights of 14 and 15 Oct can't be booked at all.
  *Fixed 2026-10-15:* once a check-in is set, the next booked night after it can be tapped as the check-out and gets a dashed gold ring. The calendar now draws booked days the way the website does: the whole day when someone stays that night, the bottom-right half on a day a guest arrives, and the top-left half on a day a guest leaves. When such a half-day is picked as a check-in or check-out, the selected green fills its free half instead of the usual circle. `handleSelectDay` also refuses to start a stay on a booked day. Verified in the simulator: Ascot 21 → 23 Oct reached Payment at £2,995. Known gap: availability is fetched from today, so a guest leaving *today* isn't drawn (cosmetic only).

- [x] **APP-2 · Splash never hides if the profile load throws.** `src/context/AuthContext.tsx:86` awaits `loadProfile()` inside `onAuthStateChanged` with no try/catch. If Firestore throws (permission-denied, or offline with no cache), `initializing` never becomes `false`, and `RootNavigator` keeps the splash up forever.
  *Fixed 2026-10-15:* the listener body is now in `try/catch/finally` and always calls `setInitializing(false)`. If the profile fails to load, the guest stays signed in without a profile, and it's fetched again each time the app returns to the foreground. Verified in the simulator with a temporary forced failure: the app opened signed in with no name, and the name appeared after a background/foreground. It's also fetched again the moment the connection comes back (NetInfo `useNetInfo`, only on a real offline → online change). Verified on an Android phone. The iOS Simulator doesn't deliver reconnect events (a known NetInfo limitation), so test that part on a device. While the profile is missing, My Profile shows "Couldn't Load Your Details" with Try Again instead of an empty form, so blank fields can never be saved over the guest's real details.

- [x] **APP-3 · Splash waits on a rates request that has no timeout.** `src/navigation/RootNavigator.tsx:32` waits for `useRates().ready`, which depends on `GET /rates`. `apiClient.ts` sets no axios timeout, so a stalled network holds the splash for as long as the request hangs. This contradicts the "splash is never delayed" comment in `RatesContext.tsx:24`.
  *Fixed 2026-10-15 (rates only):* `getAPIData` takes an optional `timeout` (default: no limit, as before), and `getRatesAPI` passes 30 s. On a timeout, the toast says "The connection is slow. Please try again." (axios `timeoutErrorMessage`). Verified in the simulator: with a never-answering URL, iOS cancelled the request after 30 s and the splash hid.
  *Still open (optional):*
  - On a stuck network the splash can still be up for about 30 s. For signed-in guests, Firestore's own wait of about 10 s for the profile runs in parallel.
  - Possible improvements: mark rates ready as soon as cached rates exist (faster normal launches), and/or cap the splash wait (e.g. 5 s) in `RootNavigator`.
  - **Every other request still has no time limit.** On Android, React Native's OkHttp timeouts are 0 (none), so on a stuck network these can spin forever: availability, the OWcal summary and Proceed re-check, `/me/bookings`, reviews, and the enquiry POST.

- [ ] **APP-4 · Availability fails open and is never retried.** `getOccupiedDatesAPI` returns `[]` on any error (`src/api/raApi.ts:35`). `useOccupiedDates` then marks the chunk as loaded (`src/hooks/useOccupiedDates.ts:63`). So a failed fetch shows every date as free for the rest of the session. The "Proceed" re-check in `CheckAvailability` fails open the same way. This becomes critical once real bookings exist.
  *Fix:* return `null` on failure, don't mark the chunk as loaded, and block Proceed with a "couldn't verify availability, try again" message.

- [x] **APP-5 · Dates show one day early for users west of UTC.** `new Date('YYYY-MM-DD')` parses as UTC midnight, so guests in the Americas see the previous day. Affected: `Payment.tsx`, `StaySummary.tsx`, `BookingConfirmed.tsx`, `BookingCard.tsx`, `BookingSummaryModal.tsx`.
  *Fixed 2026-10-16:* all five now use `fromISO()` from `src/utils/date.ts`, which reads the string as a local date. My Bookings (`BookingCard`, `BookingSummaryModal`) already did; `Payment`, `StaySummary` and `BookingConfirmed` were switched. Only the display was ever wrong: the dates sent to the plugin and Stripe are the original strings. Verified in the iOS simulator with the app running in New York time (`TZ=America/New_York`): Payment shows Mon 26 → Wed 28 Oct, as picked.

- [x] **APP-6 · A fresh clone doesn't build.** `src/constants/stripe.ts` is gitignored, but `App.tsx` imports it.
  *Fixed 2026-10-15:* the global `StripeProvider` is gone. The Payment screen gets the publishable key from the plugin's `/checkout-config` and calls `initStripe` (`useCheckoutConfig`), so nothing imports `stripe.ts` any more. The leftover local file is harmless and can be deleted.

## App — medium

- [x] **APP-7 · Property Detail shows a stale "from" price.** `src/screens/PropertyDetail/components/BottomBar.tsx:23` shows the static `property.baseRate`, while the Home `PropertyCard` shows the live `/rates` value, so the two screens can disagree.
  *Fixed 2026-10-15:* `useFromRate(property)` in `src/context/RatesContext.tsx` returns the live rate, or `baseRate` when there isn't one. `PropertyCard` and the detail `BottomBar` both use it. Verified in the simulator: Ascot shows £1,350 on Home and on its page, and Windsor shows £995 on both.
  *Confirmed in the iOS simulator (2026-10-14):* the Ascot card on Home shows "from £1,350" (live), while the Ascot detail page shows "FROM £1,450" (static).

- [ ] **APP-8 · Signing in from the drawer creates a second drawer.** `src/screens/LoginRegister/LoginRegister.tsx:107` calls `navigation.replace(DrawerRoot)`, which leaves two `DrawerRoot` entries on the stack. Android Back then lands on the old drawer.
  *Fix:* use `navigation.goBack()` (or `popTo`) for `entry: 'drawer'`.

- [ ] **APP-9 · Payment can show "TOTAL DUE £0".** If the OWcal price request fails, `Payment.tsx` passes `total ?? 0` and `ReservationSummary.tsx:103` renders £0. Book Now stays disabled, but the user isn't told why.
  *Fix:* show `priceState.error` with a retry, instead of £0.

- [ ] **APP-10 · Problems in `apiClient.ts`:**
  - `validateStatus: () => true` (lines 30, 81) means HTTP errors never reach `catch`, so the "show the server's message" toast there never runs.
  - Every request and response body is logged in all builds (lines 33, 84). That includes the Contact form's name, email and phone.

  *Fix:* gate the logs behind `__DEV__`, and decide one consistent way to handle HTTP errors.

- [ ] **APP-14 · The iOS native theme module isn't compiled into the app.** `ios/ThemePreference.swift` and `ios/TheRoyalAccommodation/ThemePreference.m` exist on disk but aren't referenced in `TheRoyalAccommodation.xcodeproj`.
  - So on iOS, `NativeModules.ThemePreference` is undefined and `ThemeContext`'s `ThemePreference?.setDarkModeEnabled(...)` silently does nothing.
  - `AppDelegate` therefore always reads `darkMode = false`. Dark-mode users get a cream launch window and a forced light native appearance, which is the white flash the code meant to prevent.
  - Verified in the simulator: after toggling dark mode, the app's preferences plist has no `darkMode` key.
  - Android registers its version (`ThemePreferencePackage`), so it should be unaffected.

  *Fix:* add both files to the app target (with a bridging header if needed). Alternatively, drop the native module and set the launch appearance some other way.

- [ ] **APP-15 · The calendar looks fully available while booked dates load.** `useOccupiedDates` exposes `loading`, but `CheckAvailability` doesn't use it. On first open, every date shows as free for a few seconds until the booked nights appear (seen in the simulator). A quick tap can select a booked date; the reconcile effect then drops it with a toast.
  *Fix:* show a loading state on the calendar, or disable day taps until the first chunk arrives.

## App — low / cleanup

- [ ] **APP-11 · Partial account states.**
  - Signup: if `createUserProfile` fails after the Auth user is created, the user is signed in with no profile.
  - Delete account: if `deleteUser` fails after the profile was deleted, the Auth user is left with no profile.

  *Fix:* recreate a missing profile on next load, and reorder or compensate the delete steps.
- [ ] **APP-12 · My Bookings filter tabs use `onTouchEnd` on a `View`** (`src/screens/MyBookings/MyBookings.tsx:61`). It fires at the end of a scroll gesture and has no accessibility role. *Fix:* use `Pressable`.
- [ ] **APP-13 · Dead code:**
  - `utils/pricing.ts`, plus the unused `calculateStayPrice` import in `Payment.tsx:9`
  - `Property.occupiedDates` and `occupiedThisMonth` in `constants/data.ts`
  - `utils/photo.ts`
  - the `functions`/`storage` exports in `firebase/config.ts` (keep them if the Cloud Function / photo work is near)
  - `STACK_ROUTES.Splash`
  - Android `CAMERA` permission (`AndroidManifest.xml:4`)
- [x] **APP-17 · My Bookings shows no loader when it refreshes on reopen.** Fixed 2026-10-14: the focus effect now sets `screenState` to `'loading'` before `load()`, so every open shows the full spinner (option A). Trade-off: the cards briefly disappear on each visit.
  *Possible polish later (option B):* keep the cards visible and show a small "Updating…" spinner instead.
- [ ] **APP-16 · The Contact map label overlaps the map's own text.** The "WINDSOR & ASCOT ESTATES" pill covers the illustration's printed "BERKSHIRE, ENGLAND" caption (`src/screens/Contact/Contact.tsx` map card). *Fix:* move the pill to the top-left, or use a map image without the caption.

## Not built yet (feature work, not bugs)

- Real payment in the app: `Payment.onBookNow` still makes up an `RA-…` reference.
  - The **plugin side is done** (v1.4.0: `/checkout-config`, `/me/checkout`, `/confirm`, `/cancel`, live but switched off; see CLAUDE.md). It already re-checks and applies coupons server-side.
  - **Still to do:**
    - wire the Payment screen to those routes;
    - fetch the Stripe key from `/checkout-config`, so `src/constants/stripe.ts` and APP-6 go away;
    - add the saved-card notice;
    - test in `RA_APP_CHECKOUT='test'` with December 2027 dates, then delete the test bookings and the `APPTEST10` coupon.
- Profile photos (Firebase Storage) are shown as "coming soon".
- The `SearchResults` route is a placeholder screen.
- The `BookingConfirmed` copy promises a confirmation email and a concierge call that nothing triggers yet.

## RA App API plugin (WordPress — source in `wordpress/ra-app-api/`)

- [x] **PLG-1 · `/my-bookings` trusts any email it's sent.** Resolved for the app in v1.2.0 (2026-10-14). The app now uses `/me/bookings`, where the plugin verifies the guest's Firebase token and uses the token's email. `/my-bookings` remains for server-to-server use only, so `RA_APP_SECRET` must never go into the app bundle.

- [ ] **PLG-8 · The site's firewall blocks requests from Google Cloud.** Calls from Cloud Functions to `wp-json/ra-app/v1/*` get a 403 before WordPress runs (blocked by IP). Phones and normal visitors pass, even without browser-like headers. It's an Apache server with no CDN, so the block comes from the host's firewall or a security plugin. This is why My Bookings verifies the token in the plugin instead of a Cloud Function.
  *No longer blocks Stripe (2026-10-15):* payment logic was moved inside the plugin (v1.4.0 checkout routes), so the path is phone → WordPress → Stripe and no Cloud Function is involved. The host is 20i (StackCP). This only matters again if a future feature needs Cloud Functions → WordPress: then ask the host to allowlist that route, or use a fixed outgoing IP (Cloud NAT, which has a monthly cost).

- [ ] **PLG-2 · The enquiry rate limit may be shared by all users.** `ra_app_client_ip()` uses `REMOTE_ADDR`. If the site sits behind Cloudflare, Sucuri or a load balancer, that's the proxy's IP, so the whole app shares one limit of 5 per 10 min.
  *Fix:* check the hosting setup. If there's a trusted proxy, read its client-IP header (e.g. `CF-Connecting-IP`).

- [ ] **PLG-3 · The enquiry acknowledgement can be abused to send spam.** The thank-you email goes to any submitted address and repeats the submitted `name`. That lets someone send branded email from the client's domain with their own text in it. The honeypot doesn't stop bots that call the API directly.
  *Fix:*
  - leave the name out of the acknowledgement, or cap its length and strip URLs;
  - add a per-recipient limit;
  - consider requiring Firebase App Check or a signed-in user.

- [ ] **PLG-4 · Smaller enquiry problems:**
  - The rate-limit count goes up before validation, so invalid submissions use up the allowance.
  - Each new submission restarts the 10-minute timer.
  - A comma in the name (e.g. "Smith, John") splits the `Reply-To` header, because `wp_mail` splits on commas.

  *Fix:* validate first, use a fixed expiry window, and quote the name or use just the email in `Reply-To`.

- [ ] **PLG-5 · `/availability` silently drops rows it can't parse.** `ra_app_add_nights` catches the date-parsing exception and returns, so a malformed or DATETIME-valued row vanishes and those nights show as free.
  *Fix:* log it and treat the row as occupied (or return an error), rather than failing open.

- [ ] **PLG-6 · `/rates` may quote an unbookable price.** `from`/`to` are min/max over all `type='accom'` rate rows, which may include expired seasons, so "from £X" could be a price nobody can book now.
  *Fix:* check OWcal's rate/season schema and only include current and future seasons.

- [x] **PLG-7 · The plugin's own documentation is out of date.** Fixed in v1.2.0: the header lists every route, and the config notes say the secret applies only to `/my-bookings`.

## Fixed

- [x] **iOS build failed: wrong Firebase config path** (fixed 2026-10-14, uncommitted at the time of writing). In `ios/TheRoyalAccommodation.xcodeproj/project.pbxproj`, `GoogleService-Info.plist` was referenced as `ios/GoogleService-Info.plist` instead of `ios/TheRoyalAccommodation/GoogleService-Info.plist`, so every fresh iOS build failed with "Build input file cannot be found". The path now carries the `TheRoyalAccommodation/` prefix like its siblings.

- [x] **My Bookings showed hard-coded demo bookings** (done 2026-10-14). It now loads real OWcal reservations via the plugin's `/me/bookings`, with upcoming/past worked out from the dates and a "Verify your email" state. The demo `BOOKINGS` have been removed.

## Cloud Functions / Google Cloud

- [ ] **GCF-1 · Functions run as the shared Compute Engine default service account.** (No functions are deployed, and Stripe no longer needs any. This applies only if functions are added later.) To make deploys build, `637799926068-compute@developer.gserviceaccount.com` was granted **Cloud Build Service Account** (`roles/cloudbuild.builds.builder`) on 2026-10-14. That same account is also the functions' runtime identity, so running functions inherit build-level access, including read/write to Cloud Storage objects.
  *Fix (with security hardening, backend plan D):* create a dedicated runtime service account that can only read the needed secrets. Set it via the `serviceAccount` option in each function's `onCall({...})`.

## Tooling

- [ ] **TOOL-1 · `yarn lint` fails.** There's no ESLint config file. *Fix:* add `.eslintrc.js` extending `@react-native`.
- [ ] **TOOL-2 · `yarn test` fails.** Jest can't transform `react-native-gesture-handler`, and `__tests__/App.test.tsx` renders the whole app, which needs native module mocks (Firebase, Stripe, splash, keyboard-controller). *Fix:* add `transformIgnorePatterns` and mocks/a `jest.setup.js`, or replace the smoke test with unit tests for `utils/` and `hooks/`.
- [ ] **TOOL-3 · `tsc` reports one error:** no type declarations for `@sominaththore/react-native-custom-status-bar` (`RootNavigator.tsx:7`). *Fix:* add a `declare module` `.d.ts` file.

# Known Issues

Bugs and risks found during the code review on 2026-10-14. They're deferred to fix later and ordered by priority within each section. Tick an item off (`[x]`) when it's fixed.

IDs: `APP-n` = the app, `PLG-n` = the RA App API WordPress plugin (source in `wordpress/ra-app-api/`; the live copy is on the site), `TOOL-n` = tooling.

## Before launch

Not bugs, but things that must happen before the app goes to the stores.

- [ ] **Switch in-app booking off until launch (Test 5).** Set `RA_APP_CHECKOUT` to `'off'` in `wp-config.php` and check that Payment shows "Coming Soon to the App". While it's `'test'`, anyone signed in on a dev build can make "Mobile app (TEST)" bookings that block real dates.
- [ ] **Launch day: switch to `'live'` and make one real booking.** Check that the guest gets OWcal's email and the payment appears in the live Stripe account, then refund it and delete the booking. The live publishable key was checked against OWcal's settings on 2026-10-16.
- [x] **Delete the `APPTEST10` test coupon** (OWcal coupon id 4) on the site. Done 2026-10-16 in WP admin; the site now answers "This coupon code is not valid."
- [x] **Delete the unused local `src/constants/stripe.ts`** (gitignored, no longer imported). Done 2026-10-16: it held only another project's test publishable key, and it was moved to the Mac's Trash.
- [x] **Decide which booking reference guests see.** Decided 2026-10-16: the app shows OWcal's booking number, e.g. **#714** (the "Id" in OWcal admin).
  - Plugin v1.4.1 returns it as `id` next to `ref` (the letter reference, e.g. `T5NMGEXP`).
  - `bookingNumber()` in `src/utils/format.ts` is the one place to switch to the letters if the client prefers.
  - Neither guest email contains a booking number, so there's nothing to clash with.
  - Verified: My Bookings and the summary pop-up show #728, and Booking Confirmed showed #729.
- [x] **Booking Confirmed promises: not app work (decided 2026-10-16).** "Your personal concierge will contact you 48 hours before arrival" and the "smart-key codes" are kept as they are; the client handles them outside the app (email or phone).
- **For the client (their OWcal settings, not app work).** Noted on 2026-10-16:
  - The Ascot "Customer confirmation" email sends only on *Reservation confirmation*; Windsor's sends on *New reservation (from customers)*. Paid bookings stay `new`, so Ascot guests probably get no confirmation email. That email is also where they're asked for two forms of ID within 48 hours.
  - The Ascot email's damage paragraph says "Royal Windsor Residence".
- [ ] **Store release.**
  - Set version numbers (still `1.0`, build 1).
  - Android: a signed AAB (signing reads `android/local.properties`).
  - iOS: an archive.
  - App Store Connect: privacy labels and screenshots.

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
  - **Every other request still has no time limit.** On Android, React Native's OkHttp timeouts are 0 (none), so on a stuck network these can spin forever: the OWcal summary, `/me/bookings`, reviews, and the enquiry POST. (The checkout requests got a 45 s limit on 2026-10-16, because leaving Payment is blocked while they run, and availability, including the Proceed re-check, got 30 s with APP-4.)

- [x] **APP-4 · Availability fails open and is never retried.** `getOccupiedDatesAPI` returns `[]` on any error (`src/api/raApi.ts:35`). `useOccupiedDates` then marks the chunk as loaded (`src/hooks/useOccupiedDates.ts:63`). So a failed fetch shows every date as free for the rest of the session. The "Proceed" re-check in `CheckAvailability` fails open the same way. This becomes critical once real bookings exist.
  *Fix:* return `null` on failure, don't mark the chunk as loaded, and block Proceed with a "couldn't verify availability, try again" message.
  *Fixed 2026-10-16 (with APP-15):*
  - `getOccupiedDatesAPI` returns `null` on failure, never `[]`, and gives up after 30 s.
  - `useOccupiedDates` doesn't mark a failed chunk as loaded, keeps already-known dates when a refresh fails, and offers `retry()`.
  - The calendar shows "Couldn't check availability" with Try Again, and its days can't be tapped meanwhile.
  - If Proceed's re-check fails, the guest stays on the screen with a toast instead of going on to Payment.
  - If Proceed's re-check finds the dates were just booked, the whole selection is cleared (the check-in may be taken too). The re-check's answer is merged into the calendar straight away (`applyFresh`), so those nights show as booked at the same moment as the toast, then the calendar reloads for anything else that changed. Verified in the iOS simulator with a faked "just booked" re-check: the toast "Sorry, those dates have just been booked…" shows, the night turns booked at once, and the guest stays on the screen.
  - Verified in the iOS simulator with forced failures.

- [x] **APP-5 · Dates show one day early for users west of UTC.** `new Date('YYYY-MM-DD')` parses as UTC midnight, so guests in the Americas see the previous day. Affected: `Payment.tsx`, `StaySummary.tsx`, `BookingConfirmed.tsx`, `BookingCard.tsx`, `BookingSummaryModal.tsx`.
  *Fixed 2026-10-16:* all five now use `fromISO()` from `src/utils/date.ts`, which reads the string as a local date. My Bookings (`BookingCard`, `BookingSummaryModal`) already did; `Payment`, `StaySummary` and `BookingConfirmed` were switched. Only the display was ever wrong: the dates sent to the plugin and Stripe are the original strings. Verified in the iOS simulator with the app running in New York time (`TZ=America/New_York`): Payment shows Mon 26 → Wed 28 Oct, as picked.

- [x] **APP-6 · A fresh clone doesn't build.** `src/constants/stripe.ts` is gitignored, but `App.tsx` imports it.
  *Fixed 2026-10-15:* the global `StripeProvider` is gone. The Payment screen gets the publishable key from the plugin's `/checkout-config` and calls `initStripe` (`useCheckoutConfig`), so nothing imports `stripe.ts` any more. The leftover local file was deleted on 2026-10-16.

## App — medium

- [x] **APP-7 · Property Detail shows a stale "from" price.** `src/screens/PropertyDetail/components/BottomBar.tsx:23` shows the static `property.baseRate`, while the Home `PropertyCard` shows the live `/rates` value, so the two screens can disagree.
  *Fixed 2026-10-15:* `useFromRate(property)` in `src/context/RatesContext.tsx` returns the live rate, or `baseRate` when there isn't one. `PropertyCard` and the detail `BottomBar` both use it. Verified in the simulator: Ascot shows £1,350 on Home and on its page, and Windsor shows £995 on both.
  *Confirmed in the iOS simulator (2026-10-14):* the Ascot card on Home shows "from £1,350" (live), while the Ascot detail page shows "FROM £1,450" (static).

- [x] **APP-8 · Signing in from the drawer creates a second drawer.** `src/screens/LoginRegister/LoginRegister.tsx:107` calls `navigation.replace(DrawerRoot)`, which leaves two `DrawerRoot` entries on the stack. Android Back then lands on the old drawer.
  *Fix:* use `navigation.goBack()` (or `popTo`) for `entry: 'drawer'`.
  *Fixed 2026-10-16:*
  - After signing in from the drawer, `LoginRegister` now uses `popTo(DrawerRoot, { screen: Home })`. It goes back to the drawer underneath instead of adding a second one.
  - The sign-in screen's Contact link had the same bug. In React Navigation 7, `navigate` to a screen already further back adds a new copy.
  - *Changed 2026-10-16:* Contact is also registered on the root stack as `ContactStack` (same component). The sign-in screen's, Payment's, My Bookings' and My Profile's Contact links open it **on top**, so Back returns to the screen you came from instead of Home, and no second drawer is created. (Inside the drawer, Back always goes to the drawer's first screen, Home.) Verified in the iOS simulator: drawer → Sign In → Contact gave `DrawerRoot > LoginRegister > ContactStack`, and Back returned to `DrawerRoot > LoginRegister`. My Bookings → Contact Concierge → Back also returned to My Bookings. Payment's and My Profile's links weren't tried in the simulator; they use the same call.
  - The drawer switching to Home/Contact when `popTo` updates its params was confirmed in React Navigation's source (`useNavigationBuilder`).
  - Verified in the iOS simulator with a temporary stack readout. Drawer → Sign In → sign in left the stack as `DrawerRoot` on Home; before the fix it was `DrawerRoot > DrawerRoot`. Drawer → Sign In → Contact also went back to a single `DrawerRoot`. Android Back wasn't tried on a device, but with one `DrawerRoot` there's no second drawer to land on.

- [x] **APP-9 · Payment can show "TOTAL DUE £0".** If the OWcal price request fails, `Payment.tsx` passes `total ?? 0` and `ReservationSummary.tsx:103` renders £0. Book Now stays disabled, but the user isn't told why.
  *Fixed 2026-10-16:* when the price fails, the total shows "Couldn't load the price" with a Try Again link instead of £0. `useOwcalSummary` gained `retry()`, which asks OWcal again with the same inputs; Check Availability doesn't use it, so it's unchanged. Pay stays disabled until a real price arrives. Verified in the iOS simulator with the first Payment price request forced to fail: the message showed, and Try Again loaded £2,995.

- [ ] **APP-10 · Problems in `apiClient.ts`:**
  - [ ] `validateStatus: () => true` (lines 30, 81) means HTTP errors never reach `catch`, so the "show the server's message" toast there never runs. *Fix (low priority):* decide one consistent way to handle HTTP errors. Callers currently rely on getting error replies back as data, so it touches every API call.
    *Partly addressed 2026-10-20:* the dead "server's message" branch was removed. Network failures now show a friendly toast through `showNetworkError()` (offline / couldn't connect / too slow, once per burst) instead of axios's raw "Network Error". Tested on Android. HTTP error replies are still handled by each caller.
  - [x] Every request and response body was logged in all builds (lines 33, 84). In release builds that goes to the phone's system log, and it included guests' names, emails, phones and addresses, the Stripe payment secret, sign-in tokens inside request errors, `AuthContext`'s whole user object and My Bookings' results.
    *Fixed 2026-10-16:* `src/utils/silenceLogsInRelease.ts`, imported first in `index.js`, makes `console.log/info/debug/warn/error` do nothing when `!__DEV__`. Debug builds log as before. This covers every log in the app and in libraries. Release builds have no crash reporting, so nothing is lost.

- [ ] **APP-14 · The iOS native theme module isn't compiled into the app.** `ios/ThemePreference.swift` and `ios/TheRoyalAccommodation/ThemePreference.m` exist on disk but aren't referenced in `TheRoyalAccommodation.xcodeproj`.
  - So on iOS, `NativeModules.ThemePreference` is undefined and `ThemeContext`'s `ThemePreference?.setDarkModeEnabled(...)` silently does nothing.
  - `AppDelegate` therefore always reads `darkMode = false`. Dark-mode users get a cream launch window and a forced light native appearance, which is the white flash the code meant to prevent.
  - Verified in the simulator: after toggling dark mode, the app's preferences plist has no `darkMode` key.
  - Android registers its version (`ThemePreferencePackage`), so it should be unaffected.

  *Fix:* add both files to the app target (with a bridging header if needed). Alternatively, drop the native module and set the launch appearance some other way.

- [x] **APP-15 · The calendar looks fully available while booked dates load.** `useOccupiedDates` exposes `loading`, but `CheckAvailability` doesn't use it. On first open, every date shows as free for a few seconds until the booked nights appear (seen in the simulator). A quick tap can select a booked date; the reconcile effect then drops it with a toast.
  *Fix:* show a loading state on the calendar, or disable day taps until the first chunk arrives.
  *Fixed 2026-10-16:*
  - Until the viewed month's booked dates have loaded once, its days are faded, can't be tapped, and show "Checking availability…". The month arrows still work.
  - Refreshing a month that's already loaded (e.g. back from Payment) shows only a small spinner next to the month name, without fading anything.
  - `useOccupiedDates` returns `status` (`loading` / `error` / `ready`) and `updating`; `Calendar` takes `status`, `updating` and `onRetry`.
  - Verified in the iOS simulator.

## App — low / cleanup

- [ ] **APP-11 · Partial account states.**
  - Signup: if `createUserProfile` fails after the Auth user is created, the user is signed in with no profile.
  - Delete account: if `deleteUser` fails after the profile was deleted, the Auth user is left with no profile.

  *Fix:* recreate a missing profile on next load, and reorder or compensate the delete steps.
- [ ] **APP-12 · My Bookings filter tabs use `onTouchEnd` on a `View`** (`src/screens/MyBookings/MyBookings.tsx:61`). It fires at the end of a scroll gesture and has no accessibility role. *Fix:* use `Pressable`.
- [ ] **APP-13 · Dead code:**
  - `utils/pricing.ts`, plus the unused `calculateStayPrice` import in `Payment.tsx:9`
  - `Property.occupiedDates` and `occupiedThisMonth` in `constants/data.ts`
  - the `functions` export in `firebase/config.ts` (keep it if Cloud Function work is near)
  - `STACK_ROUTES.Splash`
  - Android `CAMERA` permission (`AndroidManifest.xml:4`)
- [x] **APP-17 · My Bookings shows no loader when it refreshes on reopen.** Fixed 2026-10-14: the focus effect now sets `screenState` to `'loading'` before `load()`, so every open shows the full spinner (option A). Trade-off: the cards briefly disappear on each visit.
  *Possible polish later (option B):* keep the cards visible and show a small "Updating…" spinner instead.
- [ ] **APP-16 · The Contact map label overlaps the map's own text.** The "WINDSOR & ASCOT ESTATES" pill covers the illustration's printed "BERKSHIRE, ENGLAND" caption (`src/screens/Contact/Contact.tsx` map card). *Fix:* move the pill to the top-left, or use a map image without the caption.
- [ ] **APP-18 · Email and phone links fail silently when the phone can't open them.** `Linking.openURL('mailto:…')` / `tel:` in `Contact.tsx` (Email us, both phone numbers) and `DrawerContent.tsx` have no `.catch`. With no mail app set up (or `tel:` on an iPad or the simulator), the tap does nothing and the promise rejection goes unhandled (a red error in dev builds). Seen 2026-10-16 in the iOS simulator: "Unable to open URL: mailto:info@theroyalaccommodation.com". *Fix:* catch it and show a toast with the address or number, so the guest can copy it.

## Not built yet (feature work, not bugs)

- **A6 · Rates and reviews are only fetched at app start.** If the app comes back after a long time away (e.g. 30+ minutes), or the connection returns, `RatesContext` / `ReviewContext` don't refresh. Prices on Home can be out of date until the app restarts. Payment always uses OWcal's live price, so nothing is charged wrongly.
- **Check an unfinished payment the next time the app opens.** If the app is killed mid-payment, OWcal's safety net completes a paid booking or deletes an unpaid hold, but only after 15 minutes to an hour. The app could remember the started checkout and, on the next start, show "Your booking is confirmed" or release the dates straight away.
- **Apple Pay / Google Pay.** Cards only for now (Stripe `CardForm`).
- **Pets and extras in My Bookings.** The plugin doesn't return the reservation's `options` yet.
- The `SearchResults` route is a placeholder screen.

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

- [x] **Real payment in the app** (done 2026-10-15 and 16). Payment used to make up an `RA-…` reference. It now books for real through the plugin's checkout routes (v1.4.0); see "Booking flow" in CLAUDE.md:
  - The dates are held, Stripe takes the card (with 3-D Secure), and the plugin completes the booking with OWcal's code.
  - The Stripe key comes from `/checkout-config`.
  - The saved-card notice is shown, and the guest's details can be edited on Payment.
  - **Also done on 2026-10-16:**
    - **A8:** after 3-D Secure, iOS returns to the app by itself (the `theroyalaccommodation://` link).
    - Backing out of Payment frees the guest's own dates on the calendar straight away.
    - The guest can't leave Payment while a payment is in progress.
  - **Tested in `test` mode** (December 2027 dates, test bookings deleted afterwards):
    - card 4242;
    - 3-D Secure Complete and Fail, on iOS;
    - declined, then retried: one payment, one booking;
    - backing out releases the hold;
    - coupon + 2 pets, on Android;
    - back blocked while paying, on iOS and Android.
  - What's left before launch is listed under "Before launch" above.

- [x] **My Bookings showed hard-coded demo bookings** (done 2026-10-14). It now loads real OWcal reservations via the plugin's `/me/bookings`, with upcoming/past worked out from the dates and a "Verify your email" state. The demo `BOOKINGS` have been removed.

## Cloud Functions / Google Cloud

- [ ] **GCF-1 · Functions run as the shared Compute Engine default service account.** (No functions are deployed, and Stripe no longer needs any. This applies only if functions are added later.) To make deploys build, `637799926068-compute@developer.gserviceaccount.com` was granted **Cloud Build Service Account** (`roles/cloudbuild.builds.builder`) on 2026-10-14. That same account is also the functions' runtime identity, so running functions inherit build-level access, including read/write to Cloud Storage objects.
  *Fix (with security hardening, backend plan D):* create a dedicated runtime service account that can only read the needed secrets. Set it via the `serviceAccount` option in each function's `onCall({...})`.

## Tooling

- [ ] **TOOL-1 · `yarn lint` fails.** There's no ESLint config file. *Fix:* add `.eslintrc.js` extending `@react-native`.
- [ ] **TOOL-2 · `yarn test` fails.** Jest can't transform `react-native-gesture-handler`, and `__tests__/App.test.tsx` renders the whole app, which needs native module mocks (Firebase, Stripe, splash, keyboard-controller). *Fix:* add `transformIgnorePatterns` and mocks/a `jest.setup.js`, or replace the smoke test with unit tests for `utils/` and `hooks/`.
- [ ] **TOOL-3 · `tsc` reports one error:** no type declarations for `@sominaththore/react-native-custom-status-bar` (`RootNavigator.tsx:7`). *Fix:* add a `declare module` `.d.ts` file.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React Native 0.87 app (New Architecture, Hermes, TypeScript) for booking two luxury holiday homes — Ascot and Windsor — run by The Royal Accommodation. There is no app-specific server: the app talks directly to the client's WordPress site (theroyalaccommodation.com) and to Firebase.

Known bugs and deferred fixes are tracked in `KNOWN_ISSUES.md` — check it before touching an affected area, and tick items off when fixed.

## Commands

Package manager is Yarn (`yarn.lock`); Node >= 22.11.

```bash
yarn start                      # Metro
yarn android                    # build + run Android
yarn fast-run                   # Android, active arch only (faster)
yarn connect-run                # adb reverse 8081, then run Android on a device
yarn ios                        # build + run iOS
cd ios && bundle install && bundle exec pod install   # after cloning or changing native deps
npx tsc --noEmit                # typecheck
yarn android-build              # release APK
yarn android-app-bundle         # release AAB
yarn reset-gradle               # nuke Gradle caches when Android builds get wedged
yarn make-patch <pkg>           # regenerate a patch-package patch after editing node_modules
npm --prefix functions run build                                   # compile Cloud Functions (functions/)
firebase deploy --only functions --project the-royal-accommodation # deploy Cloud Functions
firebase functions:secrets:set <NAME>                              # store a server secret (the user runs this)
```

Tooling state:
- `yarn lint` fails — `@react-native/eslint-config` is installed but there is no ESLint config file in the repo.
- `yarn test` fails — the only test (`__tests__/App.test.tsx`) renders `<App />` and Jest isn't set up to transform/mock the native modules (gesture-handler, Firebase, Stripe). Single test, once working: `yarn jest __tests__/App.test.tsx -t "renders correctly"`.
- `tsc` has one known error: no type declarations for `@sominaththore/react-native-custom-status-bar`.

## Local setup gotchas

- **No Stripe key lives in the app.** The Payment screen gets the publishable key from the plugin's `/checkout-config` and calls `initStripe` (`src/hooks/useCheckoutConfig.ts`), so app and website always use the same Stripe account and mode. The gitignored `src/constants/stripe.ts` is no longer imported. The Stripe secret keys stay in OWcal's settings on the site.
- **3-D Secure return link (iOS):** after a bank check, Stripe returns to `theroyalaccommodation://safepay`. Three places must agree on that scheme:
  - `ios/TheRoyalAccommodation/Info.plist` registers it (`CFBundleURLTypes`);
  - `AppDelegate.swift` forwards it to `RCTLinkingManager`;
  - `initStripe` gets `urlScheme` (`STRIPE_URL_SCHEME` in `useCheckoutConfig.ts`).

  Payment then hands the link to `handleURLCallback`. Android needs none of this: it uses Stripe's own return link (`setReturnUrlSchemeOnAndroid` is left off). Changing the scheme needs a native iOS rebuild.
- Firebase is configured natively (`android/app/google-services.json`, `ios/TheRoyalAccommodation/GoogleService-Info.plist`); `src/firebase/config.ts` just calls `getApp()` — no `initializeApp` in JS.
- Android release signing reads `storeFile`/`storePassword`/`keyAlias`/`keyPassword` from `android/local.properties`.
- `patches/` is applied on `postinstall` (patch-package). The custom-status-bar patch rewrites the component to use safe-area insets; don't upgrade those packages without re-checking the patches.
- `ios/Podfile` uses `use_frameworks! :linkage => :dynamic` (required by RN Firebase) and explicitly links `MobileCoreServices` for `RNImageCropPicker`.

## Architecture

### App shell and splash
`App.tsx` nests providers: GestureHandler → KeyboardProvider → SafeArea → Theme → Auth → Toast → Rates → Reviews → NavigationContainer. (Stripe isn't a provider; Payment starts it with `initStripe`.) The native splash (`react-native-splash-view`) stays up until `RootNavigator` sees both `useRates().ready` and `!useAuth().initializing`, then calls `hideSplash()`. Anything that delays either of those delays app start.

### Navigation
- `src/navigation/routes.ts` holds route-name constants (`STACK_ROUTES`, `DRAWER_ROUTES`) — use them, never string literals.
- `types.ts` keys the param lists off those constants and augments `ReactNavigation.RootParamList` globally, so `useNavigation()` is typed everywhere.
- Root is a native stack; the right-side drawer is nested as the `DrawerRoot` stack screen. Booking-flow screens (PropertyDetail, CheckAvailability, LoginRegister, PaymentReview, BookingConfirmed, ForgotPassword) live on the root stack. Drawer screens reach them via `navigation.getParent()` or by navigate bubbling.
- `LoginRegister` takes `{ entry: 'drawer' }` or `{ entry: 'booking', booking: BookingDraft }`; booking entry shows the stay summary and continues to Payment.
- `BookingDraft` (ISO `YYYY-MM-DD` strings + guest counts + `propertyId`) is passed screen-to-screen through route params; there is no booking store.

### Static content vs live data
- All property content (names, copy, images, amenities, attractions, contact info) is static in `src/constants/data.ts`, keyed by `PropertyId` (`'ascot' | 'windsor'`). Each property's `owAccomId` (Ascot `1680`, Windsor `1225`) bridges to the backend; live maps from the API are keyed by `String(owAccomId)`.
- `RatesContext` / `ReviewContext` load cache-first from AsyncStorage, then refresh from the network; consumers fall back to static values (e.g. `property.baseRate`) when live data is missing.

### Backend integrations (`src/api/`, `src/firebase/`)
All HTTP goes through `apiClient.ts` (`getAPIData`, `postDataAPI`):
- Uses `validateStatus: () => true`, so HTTP error responses come back as normal data. Only transport errors hit `catch`, which shows a toast and returns `null`.
- Callers check the result shape and fall back; API helpers don't throw.
- Time limits:
  - `getAPIData` takes an optional `timeout`, and only `/rates` uses it (30 s, so the splash can't hang).
  - The checkout POSTs abort after 45 s through `postDataAPI`'s `signal`.
  - Every other request has no limit, which on Android means it can hang forever (APP-3).

Three backends:
1. **RA App WordPress plugin** — `wp-json/ra-app/v1`, in `raApi.ts`. Our own plugin; see the "RA App API plugin" section below.
2. **OWcal booking plugin** — `wp-admin/admin-ajax.php`, in `owcal.ts`.
   - Bodies are form-urlencoded, built by hand (`encodeForm`).
   - The real price comes from `ow_get_summary`, which returns HTML; `total`/`deposit` are read from the `data-charged-total-price-raw` and `data-charged-deposit-raw` attributes via regex. The price breakdown shown on Check Availability (accommodation, extras, each fee) is read from the `ow-summary-accom-price`, `ow-summary-options-price` and `ow-summary-fee` divs.
   - The pet fee is OWcal option id `1`.
   - Don't send `admin_*` fields — they trip the site's WAF (403).
3. **Firebase** — email/password Auth plus one Firestore doc per user at `users/{uid}` (shape in `src/interfaces/user.ts`).
   - OWcal owns bookings; Firestore holds only the reusable profile.
   - `email` is stored lowercased (to match OWcal's email-keyed customers).
   - Phone is stored as E.164.
   - Address is filled in later, not at signup.
   - `AuthContext` wraps all auth actions and maps the profile to a convenience `user` view; show errors with `authErrorMessage()`.

Requests to the WordPress site send browser-like headers (`OW_HEADERS` in `apiEndpoints.ts`) to get past its WAF. For JSON POSTs to `wp-json`, strip `OW_HEADERS`' urlencoded `Content-Type` first (see `sendEnquiryAPI`), otherwise WordPress parses the body as a form and the fields arrive empty.

### RA App API plugin (`wordpress/ra-app-api/ra-app-api.php`)
`wp-json/ra-app/v1` is served by our own WordPress plugin, "RA App API" (v1.4.0). Its source lives in this repo, but **the live copy is whatever is on the site**: the user updates it by pasting the file into WP admin → Plugins → Plugin File Editor. After any change, give the user the full file to paste and keep this copy in sync.

It reads OWcal's DB tables and ACF data directly. The checkout routes also **write** reservations, but only through OWcal's own classes (`global $owcal` → `$owcal->utils`, its `OwStripe` gateway, `OwPriceCalc`, `OwDataBaseActions`), never with raw inserts. Every route returns `{ success, message, data }`, and errors come back with a non-2xx status plus the same envelope. Without a local PHP install, syntax-check edits with the `php-parser` npm package.

| Route | Access | Contract |
|---|---|---|
| `GET /availability?accomId&from&to` | public | `data.occupied`: booked nights in `[from, to)`. The check-out day stays free, which is the same convention as `hasOccupiedInRange`. Includes admin/iCal blocks and respects `accom_quantity`. Window capped at 400 nights. |
| `GET /rates` | public | `{ [accomId]: { accomId, property, from, to, currency } }`: min/max of OWcal `type='accom'` nightly rate rows. |
| `GET /reviews` | public | `{ [accomId]: { accomId, property, average, count, reviews[] } }` from the ACF `reviews` post type. Every known property is present, even with 0 reviews. |
| `POST /enquiry` | public | JSON body: `name`, `email`, `message`, optional `phone` and `property`, and `company` (a honeypot; always send `''`). Rate-limited to 5 per IP per 10 min (429). Emails the business and sends the guest an acknowledgement. |
| `POST /me/bookings` | `X-Firebase-Token` header | **Used by My Bookings** (`src/firebase/bookings.ts`). The plugin verifies the Firebase ID token itself: RS256 signature against Google's published certs (cached in a transient), `aud`/`iss` = project `the-royal-accommodation`, expiry, and `email_verified`. It returns the bookings for the **token's** email. Errors carry `data.code`: `invalid-token` (401), `email-not-verified` (403), `unavailable` (503). Sent with `Cache-Control: no-store`. |
| `POST /my-bookings` | `x-ra-secret` header | Server-to-server only. Body `{ email }` → that OWcal customer's reservations: `ref, accomId, property, checkIn, checkOut, adults, children, status, paymentStatus, total, paid, amountToPay, currency, bookedOn` (no pets). Hides `waiting_payment`/`cancelled`/`multi_resa_pending`. |
| `GET /checkout-config` | public | `{ enabled, mode: 'off'\|'test'\|'live', publishableKey }`. The Stripe publishable key matches the current mode. Never cached. |
| `POST /me/checkout` | `X-Firebase-Token` | Body: `accomId, checkIn, checkOut, adults, children, pets, firstName, lastName, countryIso`, plus optional `phone, address1, address2, city, county, postCode, couponCode`. It prices the stay like OWcal's `ow_create_resa` (coupon re-checked server-side), creates or updates the OWcal customer, creates the PaymentIntent with OWcal's `process_payment()`, and holds the dates as a `waiting_payment` reservation with origin "Mobile app". Returns `{ ref, paymentIntentId, clientSecret, publishableKey, amount, currency }`, or `{ alreadyPaid, paymentIntentId }`. Codes: `checkout-off`, `invalid-request`, `dates-unavailable`, `coupon-invalid`, `price-error`, `payment-error`, `unavailable`, `invalid-token`. |
| `POST /me/checkout/confirm` | `X-Firebase-Token` | Body `{ paymentIntentId }`. Only the guest's own booking. The plugin asks Stripe itself, then completes the booking with OWcal's code. Returns `{ status: 'confirmed'\|'processing', bookingStatus, ref, total, paid, currency }`, or `not-paid` (402) / `not-found` (404). Safe to repeat. |
| `POST /me/checkout/cancel` | `X-Firebase-Token` | Body `{ paymentIntentId }`. Releases the guest's own unpaid hold: cancels the PaymentIntent, then deletes the hold. If Stripe says it was paid, it confirms instead. Returns `{ status: 'cancelled' }`. Safe to repeat. |

- **Checkout (Stripe) runs entirely in the plugin.** The path is phone → WordPress → Stripe, so the Google Cloud firewall block doesn't apply.
  - **The switch is `RA_APP_CHECKOUT` in `wp-config.php`:**
    - `off` (the default): the routes refuse, and `/checkout-config` says disabled.
    - `test`: only app requests use OWcal's stored Stripe **test** keys, via a `pre_option_ow_stripe_mode` filter. The website stays live. Confirm skips OWcal's emails, doesn't overwrite the guest's saved live Stripe customer, and restores the invoice counter.
    - `live`: OWcal's `check_uncompleted_resa()`, including its emails.
  - **Testing happens on the live site in `test` mode.** Use December 2027 dates, and delete each "Mobile app (TEST)" booking from OWcal afterwards, because they block the calendar and iCal.
  - **OWcal's own safety net:** on every page load it checks `waiting_payment` holds older than 15 min with Stripe. Paid ones are completed and emailed; unpaid ones are deleted after 1 h. So a payment still completes if the app dies after paying.
  - **On a declined card**, the app re-confirms the **same** `clientSecret` instead of calling `/me/checkout` again. Payment keeps the started checkout in `active` and starts a new one only if the coupon changed. Calling it again would replace the hold and count the coupon use again.
  - Site settings this relies on: full payment (no deposit or bond), GBP, Stripe live, "store payment method" on (cards are saved, so the app must show the "charge your card for future payments" notice), and the pet fee as OWcal option id 1. These are in `ra_app_checkout_rules()`.
- The accom-ID → slug map (`1680 → ascot`, `1225 → windsor`) exists in both the plugin (`ra_app_accom_map()`) and `constants/data.ts`. Adding a property means updating both.
- **OWcal data facts** (from its source, `database-actions/database-actions.php`; class `OwDataBaseActions`, tables prefixed `wp_ow_`):
  - **Payments** live in the reservation row's `payments_logs` JSON: entries with `amount`, `refunded_amount`, `payment_method` and an optional `delayed`. This is the "Edit payments" list in OWcal admin. The plugin computes `paid` = Σ(amount − refunded), skipping delayed entries, and `amountToPay` = price − paid.
  - OWcal's own `paid` / `amount_to_pay` columns are **not** reliable; don't use them.
  - Multi-property bookings keep payments on a parent row (`parents_resa`, linked by `parent_id`).
  - **Statuses:** `new` and `confirmed` are normal booked stays. This site doesn't require owner confirmation, so paid bookings are `new`. `pending` means awaiting the owner's confirmation. `waiting_payment`, `cancelled` and `multi_resa_pending` are hidden from the app.
  - **Payment statuses:** `paid`, `not_fully_paid`, `bond_not_paid`, `unpaid`, `payment_delayed`.
  - **Extras** (e.g. the "Pet Fee" option) are stored in the reservation's `options` column. They aren't returned to the app yet.
- **Never call `/my-bookings` from the app.** The secret proves who is calling, not which user is asking: whoever holds it can read any email's bookings, and anything in the app bundle can be extracted. The app uses `/me/bookings` with its Firebase token instead. `RA_APP_SECRET` (in `wp-config.php` and Google Secret Manager) must never go into the JS bundle.
- **The site's firewall blocks requests from Google Cloud IPs** (403 before WordPress runs), while requests from phones pass. That's why My Bookings and checkout verify the token in the plugin rather than in a Cloud Function. Any future Cloud Function → WordPress call would need the host (20i / StackCP) to allowlist that route or a fixed outgoing IP first. See `KNOWN_ISSUES.md`.

### Firebase Cloud Functions (`functions/`)
TypeScript, 2nd gen, region `europe-west2` (London, same as Firestore). Project `the-royal-accommodation`, configured in `.firebaserc` and `firebase.json`; the app's `getFunctions` uses the same region. **No functions are deployed.** Stripe ended up in the WordPress plugin instead, because of the firewall, so this folder is currently unused. Things learned while deploying:
- The project sits under the Workspace organisation, which enforces "Domain restricted sharing". That blocks the `allUsers` invoker binding `firebase deploy` tries to add for callable functions. Workaround: in Cloud Run → service → Security, choose **"Allow public access"**. Callable functions still check Firebase auth themselves.
- The build runs as `637799926068-compute@developer.gserviceaccount.com`, which needed **Cloud Build Service Account** granted manually. It's also the runtime identity; see GCF-1 in `KNOWN_ISSUES.md`.
- Secrets live in Secret Manager (`defineSecret`). `RA_APP_SECRET` is already stored there.

### Booking flow
`CheckAvailability`:
- `useOccupiedDates` fetches booked nights in 3-month chunks as the calendar pages, accumulating results; a fresh answer replaces what was held for its date range.
- Its `refresh()` runs whenever Check Availability comes back into view (e.g. from Payment):
  - It first waits for `waitForRelease()` (`src/firebase/checkout.ts`, at most 5 s), so dates the guest just let go of on Payment show as free again.
  - Dates taken meanwhile then appear, and the reconcile effect clears a selection that now covers a booked night.
- The calendar enforces `pricing.minNights` and blocks ranges that span a booked night.
- `useOwcalSummary` fetches the live price, debounced 400 ms and race-safe. `retry()` asks again with the same inputs.
- "Proceed" re-checks availability for the exact range, then routes to `LoginRegister` (signed out) or `Payment`.

`Payment` takes real card payments through the plugin's checkout routes. The API helpers are in `src/firebase/checkout.ts`, and they never throw.
- **Setup:** `useCheckoutConfig` asks `/checkout-config` and starts Stripe with that key. Its states:
  - loading;
  - `off` → "Coming Soon to the App";
  - error → Try Again;
  - ready, with a test-mode note when the site is in `test`.
- **Screen contents:**
  - the live price. If it fails: "Couldn't load the price" + Try Again, never £0.
  - the coupon card.
  - the editable "Your details" card (`DetailsCard`): first name, last name and country are required, and saving writes to My Profile.
  - Stripe `CardForm` with the saved-card notice, then the terms checkboxes.
- **Pay** (`onBookNow`):
  1. `startCheckout` (`/me/checkout`) holds the dates and creates the payment. If the plugin's amount differs from the screen, it shows the new amount and stops; the next tap pays it on the same hold.
  2. Stripe `confirmPayment` takes the card, showing 3-D Secure itself if the bank asks.
  3. `confirmCheckout` (`/me/checkout/confirm`) completes the booking. It's retried up to 3× on network errors.
  4. `navigation.replace(BookingConfirmed)` passes OWcal's real reference (`alphanum_id`) and the amount paid.
- **Messages** above the button use `BookingNotice`:
  - dates taken → "Choose Other Dates";
  - coupon no longer valid → it's removed;
  - card declined → Stripe's message;
  - paid but not confirmable → "finalising your booking" + Go to My Bookings. OWcal's safety net completes it.
- **While Pay is spinning**, the guest can't leave: `usePreventRemove` shows the toast "Please wait — your payment is in progress." Our own move to Booking Confirmed is let through (`leavingRef`). An unexpected error clears the spinner (`onPressPay`).
- **Leaving without paying** releases the hold right away: `cancelCheckout` runs on `beforeRemove`, with an unmount fallback. It's never sent once paid. If it fails, OWcal deletes the hold within the hour.

Not built:
- **Coupons:** the Payment screen's coupon card checks a code with `ow_verify_coupon` (`owVerifyCoupon`).
  - It then re-fetches `ow_get_summary` with `ow-pre-validated-coupon-id`, so OWcal itself returns the discounted total and an `ow-summary-coupon-amount` line.
  - Checking a code doesn't count a use. `/me/checkout` re-checks the code server-side and counts the use when it creates the hold.
- **Profile photos** are disabled ("coming soon"); `utils/photo.ts` and the Firebase `storage`/`functions` exports are unused.
- **Cards only:** no Apple Pay or Google Pay yet. `ow_create_resa` in `apiEndpoints.ts` is unused; the plugin creates reservations.

**My Bookings is live:** `MyBookings.tsx` → `loadMyBookings()` (`src/firebase/bookings.ts`) → plugin `/me/bookings`. Upcoming/past is worked out from `checkOut`. Unverified accounts see a "Verify your email" state; after verifying, the loader reloads the user and retries once with a fresh token.
- `utils/pricing.ts` (`calculateStayPrice`) and `Property.occupiedDates` are legacy from before live OWcal pricing and availability.

### Theming and UI conventions
- `useTheme()` → `const p = theme.palette`. Every color comes from the palette; both light and dark palettes are defined in `src/theme/theme.ts` against `ITheme`. Use `withAlpha(hex, a)` for translucency instead of new hex values.
  - Exception: the drawer (`DrawerContent`) intentionally hard-codes cream/green so it looks the same in both modes.
- `typography.*` presets carry size/weight/tracking/case but **no color**; combine them in a style array with a palette color.
- `spacing.*` is already scaled with `moderateScale` — don't wrap it again. `radius` and `borderWidth` are deliberately unscaled.
- Use `components/Text/Text` rather than RN `Text`: it applies a `bodySmall` base and caps font scaling at 1.2.
- Use `components/Icon/Icon` with semantic names. Add a new icon by extending the `IconName` union and mapping it in `FEATHER_MAP` or `MDI_MAP`.
- Screen layout: `src/screens/<Name>/<Name>.tsx` + `styles.ts` (plain `StyleSheet` or `createStyles(theme)`) + a `components/` folder for screen-only pieces. Shared UI goes in `src/components/`.
- Dark mode is saved in two places: AsyncStorage `darkMode`, and the native `ThemePreference` module (iOS `UserDefaults` via `ios/ThemePreference.swift` + `.m` bridge; Android `SharedPreferences` via `ThemePreferenceModule.kt`). The iOS `AppDelegate` reads it to set the window background before JS loads, so there's no white flash. On iOS this doesn't work yet: the Swift/ObjC files aren't in the Xcode project (APP-14).
- Feedback: `showToast(type, message)` from `utils/ToastNotifier`; confirmations use `ConfirmModal` / `PasswordPromptModal`.

### Dates, phone, money
- `src/utils/date.ts` works in local Y/M/D and builds `YYYY-MM-DD` by hand. Avoid `new Date('YYYY-MM-DD')`: it parses as UTC and shows the previous day for users west of UTC. Read these strings with `fromISO()`; every screen does since APP-5.
- Phone is optional. Validate and normalize with `utils/phone.ts` (libphonenumber-js), using the region from the selected country name (`isoForCountry` in `constants/countries.ts`).
- Format money with `formatGBP` (manual thousands grouping, since Hermes `Intl` support isn't relied on).

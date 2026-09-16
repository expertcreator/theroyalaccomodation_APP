// Central screen-name constants — no magic strings at call sites.
// Values are derived from keys so a name can't drift out of sync.

export const STACK_ROUTES = {
    Splash: 'Splash',
    DrawerRoot: 'DrawerRoot',
    PropertyDetail: 'PropertyDetail',
    CheckAvailability: 'CheckAvailability',
    SearchResults: 'SearchResults',
    LoginRegister: 'LoginRegister',
    PaymentReview: 'PaymentReview',
    BookingConfirmed: 'BookingConfirmed',
} as const;

export const DRAWER_ROUTES = {
    Home: 'Home',
    ThingsToDo: 'ThingsToDo',
    Contact: 'Contact',
    MyBookings: 'MyBookings',
    MyProfile: 'MyProfile',
} as const;
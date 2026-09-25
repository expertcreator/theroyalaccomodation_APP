import type { NavigatorScreenParams } from '@react-navigation/native';
import { STACK_ROUTES, DRAWER_ROUTES } from './routes';

// Login entry context — booking flow shows the "Your Stay" card, drawer sign-in doesn't
export type LoginEntry = 'booking' | 'drawer';

export type BookingDraft = {
    propertyId: string;
    checkIn: string;   // ISO
    checkOut: string;  // ISO
    adults: number;
    children: number;
    pets: number;
};

// Param lists are keyed off routes.ts, so a typo'd or missing key is a compile error.
// `Record<keyof typeof X, ...>` forces every route name to have a params entry.

export type DrawerParamList = {
    [DRAWER_ROUTES.Home]: undefined;
    [DRAWER_ROUTES.ThingsToDo]: undefined;
    [DRAWER_ROUTES.Contact]: undefined;
    [DRAWER_ROUTES.MyBookings]: undefined;
    [DRAWER_ROUTES.MyProfile]: undefined;
};

export type RootStackParamList = {
    [STACK_ROUTES.Splash]: undefined;
    [STACK_ROUTES.DrawerRoot]: NavigatorScreenParams<DrawerParamList> | undefined;
    [STACK_ROUTES.PropertyDetail]: { propertyId: string };
    [STACK_ROUTES.CheckAvailability]: { propertyId: string };
    [STACK_ROUTES.SearchResults]: BookingDraft;
    [STACK_ROUTES.LoginRegister]:
    | { entry: 'drawer' }
    | { entry: 'booking'; booking: BookingDraft };
    [STACK_ROUTES.PaymentReview]: BookingDraft;
    // total = the real amount charged, carried from Payment → BookingConfirmed. ← CHANGED
    [STACK_ROUTES.BookingConfirmed]: BookingDraft & { bookingRef: string; total: number };
};

// Makes useNavigation()/useRoute() typed everywhere without passing generics
declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList { }
    }
}
import { Timestamp } from '@react-native-firebase/firestore';
/**
 * Guest postal address. Collected at the first booking (not signup) and
 * reused thereafter. Every field is optional except `country`, which mirrors
 * the website's required Country field and defaults to 'United Kingdom'.
 */
export interface IUserAddress {
    line1: string | null;
    line2: string | null;
    city: string | null;
    county: string | null;
    postCode: string | null;
    country: string; // display string, e.g. 'United Kingdom'
}

/**
 * The app-owned guest profile, stored at Firestore `users/{uid}`.
 *
 * Source-of-truth notes:
 *  - Auth owns the password and is the canonical identity; `email` here is a
 *    lowercased mirror for display + matching OWcal's email-keyed customer.
 *  - OWcal owns bookings — this doc is ONLY the reusable profile, never a
 *    bookings cache.
 */
export interface IUserProfile {
    uid: string;                 // = Firebase Auth uid (same as the doc id)
    firstName: string;
    lastName: string;
    email: string;               // lowercased mirror of the Auth email
    phone: string | null;
    photoURL: string | null;     // Firebase Storage download URL; null → show initials

    address: IUserAddress;

    createdAt: Timestamp; // serverTimestamp() at signup
    updatedAt: Timestamp; // serverTimestamp() on every write
}

/**
 * Fields captured at signup. The rest of IUserProfile is defaulted
 * (address → empty with country 'United Kingdom', photoURL → null) or
 * server-managed (timestamps) by the create helper.
 */
export interface ISignupProfileInput {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    country: string;
}

/**
 * What the My Profile screen is allowed to change later. Note `email` and
 * `uid` are intentionally absent — email changes must go through an Auth
 * email-change flow, not a casual profile edit; uid never changes.
 */
export type EditableProfile = Partial<
    Pick<IUserProfile, 'firstName' | 'lastName' | 'phone' | 'photoURL'>
> & {
    address?: Partial<IUserAddress>;
};
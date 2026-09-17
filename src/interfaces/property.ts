import type { ImageSourcePropType } from 'react-native';
import type { IconName } from '../components/Icon/Icon';

export type PropertyId = 'ascot' | 'windsor';

export interface PropertyStats {
    guests: number;
    bedrooms: number;
    bathrooms: number;
}

// One highlighted stat in the 4th slot of the stats bar (e.g. POOL / HEATED)
export interface SpecialFeature {
    title: string;
    subtitle: string;
}

// A room/space tab in "The Residence" browser
export interface Room {
    id: string;
    name: string;                    // "Overview", "Bedroom 1"
    image: ImageSourcePropType;      // main image shown
    gallery: ImageSourcePropType[];  // thumbnail strip under it
}

export interface Amenity {
    icon: IconName;                  // e.g. 'pool', 'wifi'
    name: string;                    // "Indoor Heated Pool"
}

export interface Attraction {
    name: string;
    subtitle: string;
    image: ImageSourcePropType;
}

export interface Pricing {
    baseRate: number;        // per night, covers `includedAdults`
    includedAdults: number;  // adults covered by baseRate before surcharge
    extraAdultRate: number;  // per extra adult, per night
    minNights: number;
}

export interface Property {
    id: PropertyId;
    name: string;
    tag: string;                     // "Opposite Sunningdale Golf"
    location: string;               // "Ascot" / "Windsor" (hero badge)
    tagline: string;                // sub-line under the hero title
    baseRate: number;
    stats: PropertyStats;
    specialFeature: SpecialFeature;
    rating: number;
    reviews: number;
    description: string;            // short (used on the card)
    narrative: string;              // long (estate narrative on detail)
    image: ImageSourcePropType;
    gallery: ImageSourcePropType[];
    rooms: Room[];
    amenities: Amenity[];
    attractions: Attraction[];
    attractionsNarrative: string;
    pricing: Pricing;
    occupiedDates: string[];   // ISO 'YYYY-MM-DD' dates already booked
}
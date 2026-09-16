import type { ImageSourcePropType } from 'react-native';

export type PropertyId = 'ascot' | 'windsor';

export interface PropertyStats {
    guests: number;
    bedrooms: number;
    bathrooms: number;
}

export interface Property {
    id: PropertyId;
    name: string;
    tag: string;
    baseRate: number;
    stats: PropertyStats;
    rating: number;
    reviews: number;
    description: string;
    image: ImageSourcePropType;      // card/hero thumbnail
    gallery: ImageSourcePropType[];  // full set for detail screen
}
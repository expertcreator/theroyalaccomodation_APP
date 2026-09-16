import imagePath from './imagePath';
import type { Property } from '../interfaces/property';

export const ASCOT_BASE_RATE = 1250;
export const WINDSOR_BASE_RATE = 995;

export const PROPERTIES: Property[] = [
    {
        id: 'ascot',
        name: 'Luxury Ascot Golf & Spa Retreat',
        tag: 'Opposite Sunningdale Golf',
        baseRate: ASCOT_BASE_RATE,
        stats: { guests: 10, bedrooms: 5, bathrooms: 3 },
        rating: 5.0,
        reviews: 28,
        description:
            'Five-bedroom detached residence in Sunningdale, opposite Sunningdale Golf Club, with an indoor heated pool and jacuzzi.',
        image: imagePath.ascot[0],
        gallery: imagePath.ascot,
    },
    {
        id: 'windsor',
        name: 'Royal Windsor Residence',
        tag: '5-Acre Private Estate',
        baseRate: WINDSOR_BASE_RATE,
        stats: { guests: 10, bedrooms: 5, bathrooms: 5 },
        rating: 5.0,
        reviews: 34,
        description:
            'Five-bedroom private estate set in five acres near Windsor Castle, with a helipad and tennis court.',
        image: imagePath.windsor[0],
        gallery: imagePath.windsor,
    },
];

export const HERO_SLIDES = [
    { image: imagePath.windsor[0], caption: 'Windsor Great Park • Berkshire' },
    { image: imagePath.ascot[1], caption: 'Sunningdale • Ascot' },
    { image: imagePath.windsor[3], caption: 'Crown Estate Grounds • Berkshire' },
];

export const CONTACT = {
    phone: '+447736072100',
    phoneDisplay: '+44 (0) 773 607 2100',
    email: 'info@theroyalaccommodation.com',
};
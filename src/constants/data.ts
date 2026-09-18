import type { ImageSourcePropType } from 'react-native';
import imagePath from './imagePath';
import type { Property, Room, Attraction } from '../interfaces/property';
import { toISO } from '../utils/date';
import { AreaAttraction } from '../interfaces/attraction';
import { Booking } from '../interfaces/booking';

export const ASCOT_BASE_RATE = 1250;
export const WINDSOR_BASE_RATE = 995;

// Demo occupied dates: given days of the CURRENT month, as ISO strings.
// This is placeholder data — real availability will come from Firebase later.
const occupiedThisMonth = (days: number[]): string[] => {
    const now = new Date();
    return days.map((day) => toISO(new Date(now.getFullYear(), now.getMonth(), day)));
};

// Build a simple room list from a gallery (design placeholder data).
const buildRooms = (g: ImageSourcePropType[]): Room[] => [
    { id: 'overview', name: 'Overview', image: g[0], gallery: [g[0], g[1], g[2]] },
    { id: 'bed1', name: 'Bedroom 1', image: g[1], gallery: [g[1], g[2], g[3]] },
    { id: 'bed2', name: 'Bedroom 2', image: g[2], gallery: [g[2], g[3], g[4]] },
    { id: 'bed3', name: 'Bedroom 3', image: g[3], gallery: [g[3], g[4], g[5]] },
];

// Nearby attractions — shared by both properties (regional).
// NOTE: images are placeholders reusing property photos (no attraction photos yet).
const ATTRACTIONS: Attraction[] = [
    { name: 'Sunningdale Golf Club', subtitle: 'World-class championship golf', image: imagePath.ascot[2] },
    { name: 'Ascot Racecourse', subtitle: 'World-renowned racecourse & meetings', image: imagePath.ascot[4] },
    { name: 'Windsor Great Park', subtitle: 'Ancient royal deer park & parkland', image: imagePath.windsor[3] },
    { name: 'Legoland Windsor', subtitle: 'Family theme park and resort', image: imagePath.windsor[5] },
];

const ATTRACTIONS_NARRATIVE =
    'The residence is perfectly positioned for the best of Berkshire — championship golf, ' +
    'world-famous racing, royal parkland and family days out are all within easy reach.';

export const PROPERTIES: Property[] = [
    {
        id: 'ascot',
        name: 'Luxury Ascot Golf & Spa Retreat',
        tag: 'Opposite Sunningdale Golf',
        location: 'Ascot',
        tagline: 'Sunningdale, Ascot · Opposite Sunningdale Golf Club',
        baseRate: ASCOT_BASE_RATE,
        stats: { guests: 10, bedrooms: 5, bathrooms: 3 },
        specialFeature: { title: 'POOL', subtitle: 'HEATED' },
        rating: 5.0,
        reviews: 28,
        description:
            'Five-bedroom detached residence in Sunningdale, opposite Sunningdale Golf Club, with an indoor heated pool and jacuzzi.',
        narrative:
            "The Luxury Ascot Golf & Spa Retreat is a five-bedroom detached residence in one of Ascot's most prestigious areas, directly opposite Sunningdale Golf Club. It features an indoor heated swimming pool, a heated jacuzzi, two elegant living rooms, a formal dining room, a designer kitchen and a landscaped garden bordered by a stream — ideal for family holidays, golf breaks, Ascot race weekends and special occasions.",
        image: imagePath.ascot[0],
        gallery: imagePath.ascot,
        rooms: buildRooms(imagePath.ascot),
        amenities: [
            { icon: 'pool', name: 'Indoor Heated Pool' },
            { icon: 'jacuzzi', name: 'Jacuzzi' },
            { icon: 'wifi', name: 'Free WiFi' },
            { icon: 'parking', name: 'Parking' },
            { icon: 'fire', name: 'Open Fire' },
            { icon: 'dishwasher', name: 'Dishwasher' },
            { icon: 'laundry', name: 'Washing Machine' },
            { icon: 'dining', name: 'Patio Dining' },
        ],
        attractions: ATTRACTIONS,
        attractionsNarrative: ATTRACTIONS_NARRATIVE,
        pricing: { baseRate: ASCOT_BASE_RATE, includedAdults: 7, extraAdultRate: 100, minNights: 2 },
        occupiedDates: occupiedThisMonth([2, 3, 4, 15, 16, 24, 25]),
    },
    {
        id: 'windsor',
        name: 'Royal Windsor Residence',
        tag: '5-Acre Private Estate',
        location: 'Windsor',
        tagline: 'Windsor · Five-Acre Private Estate near Windsor Castle',
        baseRate: WINDSOR_BASE_RATE,
        stats: { guests: 10, bedrooms: 5, bathrooms: 5 },
        specialFeature: { title: 'HELIPAD', subtitle: 'PRIVATE' },
        rating: 5.0,
        reviews: 34,
        description:
            'Five-bedroom private estate set in five acres near Windsor Castle, with a helipad and tennis court.',
        narrative:
            'The Royal Windsor Residence is a five-bedroom private estate set in five acres of grounds near Windsor Castle. It offers a private helipad, a tennis court, extensive landscaped gardens and refined interiors throughout — a serene retreat for family gatherings, corporate stays and royal-occasion weekends.',
        image: imagePath.windsor[0],
        gallery: imagePath.windsor,
        rooms: buildRooms(imagePath.windsor),
        amenities: [
            { icon: 'tennis', name: 'Private Tennis' },
            { icon: 'helipad', name: 'Helipad' },
            { icon: 'wifi', name: 'Free WiFi' },
            { icon: 'parking', name: 'Parking' },
            { icon: 'fire', name: 'Open Fire' },
            { icon: 'dishwasher', name: 'Dishwasher' },
            { icon: 'laundry', name: 'Washing Machine' },
            { icon: 'dining', name: 'Patio Dining' },
        ],
        attractions: ATTRACTIONS,
        attractionsNarrative: ATTRACTIONS_NARRATIVE,
        pricing: { baseRate: WINDSOR_BASE_RATE, includedAdults: 4, extraAdultRate: 50, minNights: 2 },
        occupiedDates: occupiedThisMonth([6, 7, 12, 13, 20, 21]),
    },
];

export const HERO_SLIDES = [
    { image: imagePath.windsor[0], caption: 'Windsor Great Park • Berkshire' },
    { image: imagePath.ascot[1], caption: 'Sunningdale • Ascot' },
    { image: imagePath.windsor[3], caption: 'Crown Estate Grounds • Berkshire' },
];

// Look up one property by id (used by the detail screen).
export const getPropertyById = (id: string): Property =>
    PROPERTIES.find((prop) => prop.id === id) ?? PROPERTIES[0];

export const CONTACT = {
    phone: '+447736072100',
    phoneDisplay: '+44 773 607 2100',
    phone2: '+442071237052',
    phone2Display: '+44 207 123 7052',
    email: 'info@theroyalaccommodation.com',
    address: ['71-75 Shelton Street', 'London WC2H 9JQ'],
    mapsUrl: 'https://maps.google.com/?q=Windsor,Berkshire,England',
};

// Local-area guide for the "Windsor & Ascot" (Things to Do) screen.
export const AREA_ATTRACTIONS: AreaAttraction[] = [
    {
        id: 'windsor-castle',
        name: 'Windsor Castle',
        location: 'Windsor',
        description: "The oldest and largest occupied castle in the world and an official royal residence, with state apartments and St George's Chapel.",
        image: imagePath.thingsToDo.windsorCastle,
        url: 'https://www.rct.uk/visit/windsor-castle',
    },
    {
        id: 'windsor-great-park',
        name: 'Windsor Great Park',
        location: 'Windsor',
        description: 'A vast ancient royal park with woodland, deer and the famous Long Walk up to the castle.',
        image: imagePath.thingsToDo.windsorGreatPark,
        url: 'https://www.windsorgreatpark.co.uk',
    },
    {
        id: 'royal-windsor-racecourse',
        name: 'Royal Windsor Racecourse',
        location: 'Windsor',
        description: 'A riverside racecourse on the Thames, known for its popular Monday evening flat racing.',
        image: imagePath.thingsToDo.windsorRacecourse,
        url: 'https://www.windsor-racecourse.co.uk',
    },
    {
        id: 'ascot-racecourse',
        name: 'Ascot Racecourse',
        location: 'Ascot',
        description: "One of the world's most famous racecourses and home of Royal Ascot.",
        image: imagePath.thingsToDo.ascotRacecourse,
        url: 'https://www.ascot.com',
    },
    {
        id: 'sunningdale-golf',
        name: 'Sunningdale Golf Club',
        location: 'Sunningdale',
        description: 'A renowned heathland golf club with two championship courses.',
        image: imagePath.thingsToDo.sunningdaleGolf,
        url: 'https://www.sunningdalegolfclub.co.uk',
    },
    {
        id: 'legoland-windsor',
        name: 'Legoland Windsor Resort',
        location: 'Windsor',
        description: 'A popular family theme park with rides and attractions set in Berkshire parkland.',
        image: imagePath.thingsToDo.legoland,
        url: 'https://www.legoland.co.uk',
    },
];

// Static demo bookings (placeholder). Real bookings come from Firestore later.
export const BOOKINGS: Booking[] = [
    {
        ref: 'RA-84029-WN',
        propertyId: 'windsor',
        status: 'upcoming',
        checkIn: '2025-06-18',
        checkOut: '2025-06-21',
        adults: 4,
        children: 0,
        pets: 0,
        totalPaid: 2985,   // Windsor £995 × 3 nights
    },
    {
        ref: 'RA-61904-AS',
        propertyId: 'ascot',
        status: 'past',
        checkIn: '2025-05-12',
        checkOut: '2025-05-15',
        adults: 2,
        children: 0,
        pets: 0,
        totalPaid: 3750,   // Ascot £1,250 × 3 nights
    },
];
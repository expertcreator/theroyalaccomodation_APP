import React, { ComponentProps } from 'react';
import { Feather } from '@react-native-vector-icons/feather/static';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { moderateScale } from 'react-native-size-matters';

export type IconName =
    // Feather (UI icons)
    | 'back' | 'close' | 'menu' | 'share' | 'bookmark'
    | 'guests' | 'bedrooms' | 'bathrooms' | 'arrow-right' | 'chevron-right'
    | 'plus' | 'minus' | 'search' | 'info'
    // MaterialDesignIcons (brand + amenities)
    | 'crown' | 'pool' | 'jacuzzi' | 'wifi' | 'parking'
    | 'fire' | 'dishwasher' | 'laundry' | 'dining' | 'tennis' | 'helipad'
    | 'mail' | 'phone' | 'map-pin' | 'external-link' | 'chevron-down'
    | 'lock' | 'eye' | 'eye-off' | 'shield' | 'user' | 'check';

type FeatherName = ComponentProps<typeof Feather>['name'];
type MdiName = ComponentProps<typeof MaterialDesignIcons>['name'];

// Feather icons.
const FEATHER_MAP: Partial<Record<IconName, FeatherName>> = {
    back: 'chevron-left',
    close: 'x',
    menu: 'menu',
    share: 'share',
    bookmark: 'bookmark',
    guests: 'users',
    bedrooms: 'home',
    bathrooms: 'droplet',
    'arrow-right': 'arrow-right',
    'chevron-right': 'chevron-right',
    plus: 'plus',
    minus: 'minus',
    search: 'search',
    info: 'info',
    mail: 'mail',
    phone: 'phone',
    'map-pin': 'map-pin',
    'external-link': 'external-link',
    'chevron-down': 'chevron-down',
    lock: 'lock',
    eye: 'eye',
    'eye-off': 'eye-off',
    shield: 'shield',
    user: 'user',
    check: 'check',
};

// MaterialDesignIcons — icons Feather doesn't have.
const MDI_MAP: Partial<Record<IconName, MdiName>> = {
    crown: 'crown',
    pool: 'pool',
    jacuzzi: 'hot-tub',
    wifi: 'wifi',
    parking: 'car',
    fire: 'fireplace',
    dishwasher: 'dishwasher',
    laundry: 'washing-machine',
    dining: 'silverware-fork-knife',
    tennis: 'tennis',
    helipad: 'helicopter',
};

type Props = { name: IconName; size?: number; color?: string };

const Icon: React.FC<Props> = ({ name, size = 20, color = '#000' }) => {
    const scaledSize = moderateScale(size);

    // Try MaterialDesignIcons first.
    const mdiName = MDI_MAP[name];
    if (mdiName) {
        return <MaterialDesignIcons name={mdiName} size={scaledSize} color={color} />;
    }

    // Otherwise it's a Feather icon.
    const featherName = FEATHER_MAP[name];
    return <Feather name={featherName!} size={scaledSize} color={color} />;
};

export default Icon;
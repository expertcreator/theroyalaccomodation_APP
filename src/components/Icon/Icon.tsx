import React, { ComponentProps } from 'react';
import { Feather } from '@react-native-vector-icons/feather/static';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { moderateScale } from 'react-native-size-matters';

export type IconName =
    | 'back' | 'close' | 'menu' | 'share' | 'bookmark'
    | 'guests' | 'bedrooms' | 'bathrooms' | 'arrow-right' | 'chevron-right'
    | 'crown';   // ← from MaterialDesignIcons, not Feather

// Feather names for everything except the MDI ones below.
type FeatherName = ComponentProps<typeof Feather>['name'];

const FEATHER_MAP: Record<Exclude<IconName, 'crown'>, FeatherName> = {
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
};

type Props = { name: IconName; size?: number; color?: string };

const Icon: React.FC<Props> = ({ name, size = 20, color = '#000' }) => {
    const scaledSize = moderateScale(size);

    // MaterialDesignIcons handles the crown.
    if (name === 'crown') {
        return <MaterialDesignIcons name="crown" size={scaledSize} color={color} />;
    }

    // Everything else is a Feather icon.
    return <Feather name={FEATHER_MAP[name]} size={scaledSize} color={color} />;
};

export default Icon;
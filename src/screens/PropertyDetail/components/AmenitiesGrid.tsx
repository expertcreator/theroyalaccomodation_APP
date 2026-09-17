import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing } from '../../../theme';
import { withAlpha } from '../../../utils/color';
import Text from '../../../components/Text/Text';
import Icon from '../../../components/Icon/Icon';
import SectionHeader from '../../../components/Headers/SectionHeader';
import type { Property } from '../../../interfaces/property';
import { styles } from '../styles';

type Props = { property: Property };

const AmenitiesGrid: React.FC<Props> = ({ property }) => {
    const { theme } = useTheme();
    const p = theme.palette;
    return (
        <View>
            <SectionHeader title="ESTATE AMENITIES" rightText="CONCIERGE SERVICED" />
            <View style={[styles.grid, { marginTop: spacing.md }]}>
                {property.amenities.map((a, i) => (
                    <View key={i} style={[styles.amenityCard, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
                        <View style={[styles.amenityIcon, { backgroundColor: p.background.default, borderColor: withAlpha(p.accent.main, 0.25) }]}>
                            <Icon name={a.icon} size={16} color={p.accent.main} />
                        </View>
                        <Text style={[typography.caption, { color: p.text.primary, flex: 1 }]} numberOfLines={2}>
                            {a.name}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

export default AmenitiesGrid;
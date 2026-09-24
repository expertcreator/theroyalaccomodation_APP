import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderWidth, fontSizes } from '../../../theme';
import Text from '../../../components/Text/Text';
import type { Property } from '../../../interfaces/property';
import { styles } from '../styles';

type Props = { property: Property };

const StatsBar: React.FC<Props> = ({ property }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    const items = [
        { value: String(property.stats.guests), label: 'GUESTS' },
        { value: String(property.stats.bedrooms), label: 'BEDS' },
        { value: String(property.stats.bathrooms), label: 'BATHS' },
        { value: property.specialFeature.title, label: property.specialFeature.subtitle, gold: true },
    ];

    return (
        <View style={[styles.statsCard, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
            {items.map((it, i) => (
                <View
                    key={i}
                    style={[styles.statCol, i < 3 && { borderRightWidth: borderWidth.thin, borderRightColor: p.divider }]}
                >
                    <Text style={[typography.headerTitle, { color: it.gold ? p.accent.dark : p.text.primary }]}>
                        {it.value}
                    </Text>
                    <Text style={[typography.overline, { color: p.text.placeHolder, marginTop: spacing.xxs }]}>
                        {it.label}
                    </Text>
                </View>
            ))}
        </View>
    );
};

export default StatsBar;
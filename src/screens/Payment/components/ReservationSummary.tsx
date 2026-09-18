import React from 'react';
import { View, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing } from '../../../theme';
import { withAlpha } from '../../../utils/color';
import { formatGBP } from '../../../utils/format';
import { formatDayLabel } from '../../../utils/date';
import Text from '../../../components/Text/Text';
import Icon from '../../../components/Icon/Icon';
import type { Property } from '../../../interfaces/property';
import { styles } from '../styles';

type Props = {
    property: Property;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    guests: number;
    pets: number;
    total: number;
};

const ReservationSummary: React.FC<Props> = ({ property, checkIn, checkOut, nights, guests, pets, total }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    const GoldHairline = () => (
        <LinearGradient
            colors={['transparent', withAlpha(p.accent.main, 0.6), 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.goldHairline}
        />
    );

    return (
        <View style={[styles.card, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
            {/* Property header */}
            <View style={styles.propHeader}>
                <Image source={property.image} style={styles.thumb} resizeMode="cover" />
                <View style={{ flex: 1 }}>
                    <Text style={[typography.overline, { color: p.accent.dark }]}>YOUR STAY</Text>
                    <Text style={[typography.title, { color: p.primary.main, marginTop: spacing.xxs }]} numberOfLines={1}>
                        {property.name}
                    </Text>
                    <Text style={[typography.caption, { color: p.text.placeHolder, marginTop: spacing.xxs }]} numberOfLines={1}>
                        {property.tagline}
                    </Text>
                </View>
            </View>

            <GoldHairline />

            {/* Arrival / departure */}
            <View style={styles.datesRow}>
                <View style={styles.dateCol}>
                    <Text style={[typography.overline, { color: p.text.placeHolder }]}>ARRIVAL</Text>
                    <Text style={[typography.bodySmall, { color: p.text.primary, fontWeight: '600', marginTop: spacing.xxs }]}>
                        {formatDayLabel(checkIn)}
                    </Text>
                </View>
                <View style={styles.dateCol}>
                    <Text style={[typography.overline, { color: p.text.placeHolder }]}>DEPARTURE</Text>
                    <Text style={[typography.bodySmall, { color: p.text.primary, fontWeight: '600', marginTop: spacing.xxs }]}>
                        {formatDayLabel(checkOut)}
                    </Text>
                </View>
            </View>

            {/* Nights + guests strip */}
            <View style={[styles.strip, { backgroundColor: p.background.default, borderColor: p.borderColor }]}>
                <View style={styles.stripItem}>
                    <Icon name="moon" size={14} color={p.accent.main} />
                    <Text style={[typography.caption, { color: p.text.primary }]}>{nights} {nights === 1 ? 'Night' : 'Nights'}</Text>
                </View>
                <Text style={{ color: p.divider }}>·</Text>
                <View style={styles.stripItem}>
                    <Icon name="guests" size={14} color={p.accent.main} />
                    <Text style={[typography.caption, { color: p.text.primary }]}>{guests} {guests === 1 ? 'Guest' : 'Guests'}</Text>
                </View>
                {pets > 0 && (
                    <>
                        <Text style={{ color: p.divider }}>·</Text>
                        <View style={styles.stripItem}>
                            <Icon name="paw" size={14} color={p.accent.main} />
                            <Text style={[typography.caption, { color: p.text.primary }]}>{pets} {pets === 1 ? 'Pet' : 'Pets'}</Text>
                        </View>
                    </>
                )}
            </View>

            <GoldHairline />

            {/* Total */}
            <View style={styles.totalRow}>
                <View>
                    <Text style={[typography.overline, { color: p.text.placeHolder }]}>TOTAL DUE (GBP)</Text>
                    <Text style={[typography.caption, { color: p.text.placeHolder, marginTop: spacing.xxs }]}>Includes taxes and VAT</Text>
                </View>
                <Text style={[typography.h1, { color: p.primary.main }]}>{formatGBP(total)}</Text>
            </View>
        </View>
    );
};

export default ReservationSummary;
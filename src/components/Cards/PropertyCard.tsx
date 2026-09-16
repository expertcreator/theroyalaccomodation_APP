import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography, radius, spacing, borderWidth, ITheme } from '../../theme';
import { withAlpha } from '../../utils/color';
import { formatGBP } from '../../utils/format';
import Text from '../Text/Text';
import Icon, { IconName } from '../Icon/Icon';
import Button from '../Buttons/Button';
import type { Property } from '../../interfaces/property';

type Props = { property: Property; onPress: () => void };

const IMG_H = 230;

const PropertyCard: React.FC<Props> = ({ property, onPress }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const p = theme.palette;

    const pillBg = withAlpha(p.primary.main, 0.85);
    const pillBorder = withAlpha(p.accent.main, 0.3);

    const Stat = ({ icon, label }: { icon: IconName; label: string }) => (
        <View style={styles.stat}>
            <Icon name={icon} size={14} color={p.accent.main} />
            <Text
                style={[typography.caption, { color: p.text.primary, marginLeft: spacing.xs }]}
                numberOfLines={1}
            >
                {label}
            </Text>
        </View>
    );

    const Dot = () => (
        <Text style={{ color: withAlpha(p.accent.main, 0.6), fontSize: moderateScale(9) }}>•</Text>
    );

    return (
        <View style={styles.card}>
            {/* Image + overlays */}
            <View style={styles.imageWrap}>
                <Image source={property.image} style={styles.image} resizeMode="cover" />
                <LinearGradient
                    colors={['rgba(0,0,0,0.10)', 'transparent', 'rgba(0,0,0,0.45)']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={[styles.pill, styles.tagPos, { backgroundColor: pillBg, borderColor: pillBorder }]}>
                    <Text style={[typography.overline, { color: p.primary.contrastText }]} numberOfLines={1}>
                        {property.tag}
                    </Text>
                </View>
                <View style={[styles.pill, styles.pricePos, { backgroundColor: pillBg, borderColor: pillBorder }]}>
                    <Text style={[typography.caption, { color: withAlpha(p.primary.contrastText, 0.8) }]}>from </Text>
                    <Text style={[typography.headerTitle, { color: p.primary.contrastText }]}>
                        {formatGBP(property.baseRate)}
                    </Text>
                    <Text style={[typography.caption, { color: withAlpha(p.primary.contrastText, 0.7) }]}> / night</Text>
                </View>
            </View>

            {/* Body */}
            <View style={styles.body}>
                <View style={[styles.statsRow, { borderBottomColor: p.divider }]}>
                    <Stat icon="guests" label={`${property.stats.guests} guests`} />
                    <Dot />
                    <Stat icon="bedrooms" label={`${property.stats.bedrooms} beds`} />
                    <Dot />
                    <Stat icon="bathrooms" label={`${property.stats.bathrooms} baths`} />
                </View>

                <Text style={[typography.title, { color: p.primary.main, marginBottom: spacing.xs }]}>
                    {property.name}
                </Text>

                <View style={styles.ratingRow}>
                    <Text style={{ color: p.accent.main, fontSize: moderateScale(11), letterSpacing: 1 }}>★★★★★</Text>
                    <Text style={[typography.caption, { color: p.primary.main, fontWeight: '600', marginLeft: spacing.xs }]}>
                        {property.rating.toFixed(1)}
                    </Text>
                    <Text style={[typography.caption, { color: p.text.placeHolder, marginLeft: spacing.xs }]}>
                        ({property.reviews} reviews)
                    </Text>
                </View>

                <Text style={[typography.bodySmall, { color: p.text.placeHolder, marginBottom: spacing.lg }]}>
                    {property.description}
                </Text>

                <Button title="View Property" variant="outline" rightIcon="arrow-right" onPress={onPress} />
            </View>
        </View>
    );
};

const createStyles = (theme: ITheme) => StyleSheet.create({
    card: {
        borderRadius: radius.xl,
        borderWidth: borderWidth.thin,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
        backgroundColor: theme.palette.background.card,
        borderColor: theme.palette.borderColor,
    },
    imageWrap: { width: '100%', height: verticalScale(IMG_H) },
    image: { width: '100%', height: '100%' },
    pill: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.pill,
        borderWidth: borderWidth.thin,
    },
    tagPos: { top: spacing.md, left: spacing.md },
    pricePos: { bottom: spacing.md, right: spacing.md },
    body: { padding: spacing.lg },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: spacing.md,
        marginBottom: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    stat: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
});

export default PropertyCard;
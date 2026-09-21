import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { spacing, radius, borderWidth } from '../../theme';

export const HERO_H = verticalScale(400);

export const styles = StyleSheet.create({
    container: { flex: 1, },
    content: { paddingHorizontal: spacing.xl2, paddingTop: spacing.lg, rowGap: spacing.xl },

    // Hero
    hero: { width: '100%', height: HERO_H, overflow: 'hidden' },
    heroImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
    heroContent: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.xl2 },
    badge: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.40)', borderWidth: borderWidth.thin, borderRadius: radius.pill,
        paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    },
    badgeDot: { width: moderateScale(6), height: moderateScale(6), borderRadius: radius.pill, marginRight: spacing.sm },
    heroButton: { marginTop: spacing.lg, alignSelf: 'flex-start' },

    // Stats
    statsCard: {
        flexDirection: 'row',
        borderWidth: borderWidth.thin,
        borderRadius: radius.lg,
        paddingVertical: spacing.md,
    },
    statCol: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xs },

    // Amenities
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.sm },
    amenityCard: {
        width: '48%', flexDirection: 'row', alignItems: 'center',
        borderWidth: borderWidth.thin, borderRadius: radius.md, padding: spacing.md,
    },
    amenityIcon: {
        width: moderateScale(36), height: moderateScale(36), borderRadius: radius.sm,
        borderWidth: borderWidth.thin, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
    },

    // Attractions
    attractionRow: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: borderWidth.thin, borderRadius: radius.md, padding: spacing.sm,
    },
    attractionImg: { width: moderateScale(60), height: moderateScale(60), borderRadius: radius.sm, marginRight: spacing.md },
    narrativeCard: { marginTop: spacing.md, borderWidth: borderWidth.thin, borderRadius: radius.md, padding: spacing.md },

    // Bottom bar
    bottomBar: {
        position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: spacing.md, paddingHorizontal: spacing.xl2,
    },
    bottomHairline: { position: 'absolute', top: 0, left: 0, right: 0, height: borderWidth.thin },
    bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: spacing.md },
    priceCol: { flexShrink: 1 },
    priceLine: { flexDirection: 'row', alignItems: 'baseline' },
});
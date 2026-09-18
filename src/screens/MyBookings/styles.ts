import { StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { spacing, radius, borderWidth } from '../../theme';

export const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.xl2, paddingTop: spacing.lg, paddingBottom: spacing.xxxl },

    // Intro
    intro: { alignItems: 'center', marginBottom: spacing.lg },
    introText: { textAlign: 'center', marginTop: spacing.md },

    // Filter tabs
    tabs: {
        flexDirection: 'row', borderWidth: borderWidth.thin,
        borderRadius: radius.pill, padding: moderateScale(3), marginBottom: spacing.xl,
    },
    tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: 'center' },

    // Booking card
    card: { borderRadius: radius.lg, borderWidth: borderWidth.thin, overflow: 'hidden', marginBottom: spacing.lg },
    cardTop: { flexDirection: 'row', padding: spacing.md, columnGap: spacing.md },
    thumb: {
        width: moderateScale(84),
        minHeight: moderateScale(100),
        maxHeight: moderateScale(120),
        borderRadius: radius.md,
    },
    cardBody: { flex: 1 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
    badge: {
        flexDirection: 'row', alignItems: 'center', columnGap: spacing.xs,
        paddingHorizontal: spacing.sm, paddingVertical: moderateScale(3), borderRadius: radius.pill,
    },
    badgeDot: { width: moderateScale(5), height: moderateScale(5), borderRadius: radius.pill },
    locationRow: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.xs, marginTop: spacing.xxs },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: spacing.sm },

    // Card footer strip
    footer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: borderWidth.thin,
    },
    footerLeft: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.xs, flex: 1, marginRight: spacing.sm },
    viewSummary: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.xs, flexShrink: 0 },

    metaDivider: { height: borderWidth.thin, marginTop: spacing.sm },
});
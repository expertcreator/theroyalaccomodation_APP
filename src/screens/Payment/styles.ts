import { Platform, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { spacing, radius, borderWidth } from '../../theme';

export const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.xl2, paddingTop: spacing.lg, paddingBottom: spacing.xxxl },

    // Card shell (used by summary + stripe note)
    card: {
        borderRadius: radius.lg,
        borderWidth: borderWidth.thin,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },

    // Summary — property header
    propHeader: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.md, paddingBottom: spacing.md },
    thumb: { width: moderateScale(56), height: moderateScale(56), borderRadius: radius.md },

    goldHairline: { height: borderWidth.thin, marginVertical: spacing.xs },

    // Arrival / departure grid
    datesRow: {
        flexDirection: 'row',
        paddingVertical: spacing.md,
        // columnGap: spacing.lg,
        justifyContent: "space-between"
    },
    dateCol: { flex: 1, alignItems: 'center' },

    // Nights + guests strip
    strip: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
        paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
        borderRadius: radius.md, borderWidth: borderWidth.thin, marginBottom: spacing.md,
    },
    stripItem: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.xs },

    // Total
    totalRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: spacing.md },

    // Stripe placeholder note
    stripeNote: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.sm, justifyContent: 'center' },

    // Terms
    terms: { rowGap: spacing.md, marginBottom: spacing.lg, paddingHorizontal: spacing.xs },
    termRow: { flexDirection: 'row', alignItems: 'flex-start', columnGap: spacing.sm },
    checkbox: {
        width: moderateScale(18), height: moderateScale(18), borderRadius: radius.sm,
        borderWidth: borderWidth.thin, alignItems: 'center', justifyContent: 'center', marginTop: moderateScale(1),
    },

    assurance: { textAlign: 'center', marginTop: spacing.sm },

    payHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },

    cardForm: { width: '100%', height: moderateScale(Platform.OS === "ios" ? 180 : 250) },  // trim from 200; tune to fit
    secureLine: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', columnGap: spacing.sm,
        marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: borderWidth.thin, borderTopColor: 'transparent',
    },
});
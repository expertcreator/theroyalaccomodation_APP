import { StyleSheet } from 'react-native';
import { spacing, radius, borderWidth } from '../../theme';
import { verticalScale } from 'react-native-size-matters';

export const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.xl2, paddingTop: spacing.xl, paddingBottom: verticalScale(100) },

    // Title block
    titleBlock: { alignItems: 'center', marginBottom: spacing.xl },
    goldDivider: { width: 96, height: borderWidth.thin, marginTop: spacing.sm },

    // Date summary card
    summaryCard: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: borderWidth.thin, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xl,
    },
    summaryCol: { flex: 1 },
    summaryCenter: { alignItems: 'center', paddingHorizontal: spacing.md },
    nightsPill: { borderWidth: borderWidth.thin, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs },

    // Min-stay notice
    minStay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', columnGap: spacing.xs, marginVertical: spacing.lg },

    // Guests card
    guestsCard: { borderWidth: borderWidth.thin, borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.xs },
    guestsHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: spacing.md, marginBottom: spacing.sm, borderBottomWidth: borderWidth.thin,
    },

    // Stepper row
    stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
    stepperControls: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.md },
    stepperBtn: { width: 32, height: 32, borderRadius: radius.pill, borderWidth: borderWidth.thin, alignItems: 'center', justifyContent: 'center' },
    stepperValue: { minWidth: 24, textAlign: 'center' },

    // Bottom bar
    bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: spacing.md, paddingHorizontal: spacing.xl2 },
    bottomHairline: { position: 'absolute', top: 0, left: 0, right: 0, height: borderWidth.thin },
    bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: spacing.md },
    totalCol: { flexShrink: 1 },
});
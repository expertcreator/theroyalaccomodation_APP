import { Platform, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { spacing, radius, borderWidth } from '../../theme';

export const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        paddingHorizontal: spacing.xl2,
        paddingTop: spacing.xxxl + (Platform.OS === "ios" ? spacing.md : 0),
        paddingBottom: spacing.xxxl
    },

    // Crest
    crest: {
        width: moderateScale(64),
        height: moderateScale(64),
        borderRadius: radius.pill,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: moderateScale(2),
    },
    header: { alignItems: 'center', marginTop: spacing.lg },
    ref: { marginTop: spacing.sm },

    // Recap card
    card: {
        borderRadius: radius.lg, borderWidth: borderWidth.thin,
        padding: spacing.md, marginTop: spacing.xl, flexDirection: 'row', columnGap: spacing.md,
    },
    thumb: { width: moderateScale(76), height: moderateScale(76), borderRadius: radius.md },
    cardBody: { flex: 1 },
    totalRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: borderWidth.thin,
    },

    // Steps card
    stepsCard: {
        borderRadius: radius.lg, borderWidth: borderWidth.thin,
        padding: spacing.lg, marginTop: spacing.lg,
    },
    stepsHeader: { paddingBottom: spacing.sm, marginBottom: spacing.md, borderBottomWidth: borderWidth.thin },
    stepRow: { flexDirection: 'row', columnGap: spacing.md, marginBottom: spacing.md },
    stepNum: {
        width: moderateScale(20), height: moderateScale(20), borderRadius: radius.pill,
        borderWidth: borderWidth.thin, alignItems: 'center', justifyContent: 'center', marginTop: moderateScale(1),
    },

    actions: { rowGap: spacing.md, marginTop: spacing.xl },
});
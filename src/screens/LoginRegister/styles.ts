import { StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { spacing, radius, borderWidth } from '../../theme';

export const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        paddingHorizontal: spacing.xl2,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xxxl,
    },

    // Title block
    titleBlock: { alignItems: 'center', marginBottom: spacing.xl },
    secureRow: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.xs, marginBottom: spacing.sm },
    subtitle: { textAlign: 'center', marginTop: spacing.sm },

    // Tabs
    tabs: { flexDirection: 'row', justifyContent: 'center', columnGap: spacing.xxl, marginBottom: spacing.xl },
    tab: { alignItems: 'center', paddingBottom: spacing.xs },
    tabBar: { height: moderateScale(2), width: '100%', borderRadius: radius.pill, marginTop: spacing.xs },

    // Form
    fields: { rowGap: spacing.lg },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.sm },
    checkbox: {
        width: moderateScale(18), height: moderateScale(18), borderRadius: radius.sm,
        borderWidth: borderWidth.thin, alignItems: 'center', justifyContent: 'center',
    },

    // Footer badges
    footer: { alignItems: 'center', marginTop: spacing.xl, rowGap: spacing.sm },
    badge: {
        flexDirection: 'row', alignItems: 'center', columnGap: spacing.xs,
        paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
        borderRadius: radius.pill,
    },

    helpRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: borderWidth.thin, borderRadius: radius.md,
        paddingHorizontal: spacing.md, paddingVertical: spacing.md,
        marginTop: spacing.md, alignSelf: 'stretch',
    },
    helpLeft: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.sm },
    helpRight: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.xs },

    card: {
        backgroundColor: undefined, // set inline from theme
        borderRadius: radius.lg,
        borderWidth: borderWidth.thin,
        padding: spacing.lg,
        // soft shadow to lift it off the cream (matches your other cards)
        // shadowColor: '#000',
        // shadowOpacity: 0.06,
        // shadowRadius: 12,
        // shadowOffset: { width: 0, height: 4 },
        // elevation: 3,
    },
});
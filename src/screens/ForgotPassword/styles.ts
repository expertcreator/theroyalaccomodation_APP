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
    titleBlock: { alignItems: 'center', marginBottom: spacing.xl },
    secureRow: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.xs, marginBottom: spacing.sm },
    fields: { rowGap: spacing.lg },
    sentBlock: { alignItems: 'center' },
    checkRing: {
        width: moderateScale(58), height: moderateScale(58), borderRadius: moderateScale(29),
        borderWidth: borderWidth.thin, alignItems: 'center', justifyContent: 'center',
    },
    card: {
        borderRadius: radius.lg,
        borderWidth: borderWidth.thin,
        padding: spacing.lg,
    },
});
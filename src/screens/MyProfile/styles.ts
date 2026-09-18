import { StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { spacing, radius, borderWidth } from '../../theme';

export const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.xl2, paddingTop: spacing.lg, paddingBottom: spacing.xxxl },

    // Avatar block
    hero: { alignItems: 'center', marginBottom: spacing.md },
    avatarWrap: { width: moderateScale(78), height: moderateScale(78) },
    avatar: {
        width: moderateScale(74), height: moderateScale(74), borderRadius: moderateScale(37),
        borderWidth: moderateScale(2), alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%' },
    cameraBadge: {
        position: 'absolute', bottom: 0, right: 0,
        width: moderateScale(26), height: moderateScale(26), borderRadius: moderateScale(13),
        borderWidth: moderateScale(2), alignItems: 'center', justifyContent: 'center',
    },
    name: { marginTop: spacing.md, textAlign: 'center' },
    email: { marginTop: spacing.xxs, textAlign: 'center' },

    // Fields
    fields: { rowGap: spacing.md, marginTop: spacing.xs },

    saveWrap: { marginTop: spacing.xl },
});
import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { spacing, radius, borderWidth } from '../../theme';

export const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.xl2, paddingTop: spacing.xl, paddingBottom: spacing.xxxl },

    // Title block
    titleBlock: { alignItems: 'center', marginBottom: spacing.xl },
    subtitle: { textAlign: 'center', maxWidth: moderateScale(300), marginTop: spacing.sm },

    // Attraction card
    card: { borderRadius: radius.xl, borderWidth: borderWidth.thin, overflow: 'hidden', marginBottom: spacing.xl },
    imageWrap: { width: '100%', height: verticalScale(190) },
    image: { width: '100%', height: '100%' },
    pill: {
        position: 'absolute', top: spacing.md, left: spacing.md,
        paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
        borderRadius: radius.pill, borderWidth: borderWidth.thin,
    },
    body: { padding: spacing.lg },
    linkRow: { flexDirection: 'row', alignItems: 'center' },
});
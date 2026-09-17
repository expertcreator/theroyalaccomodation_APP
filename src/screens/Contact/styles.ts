import { StyleSheet } from 'react-native';
import { spacing, radius, borderWidth } from '../../theme';

export const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.xl2, paddingTop: spacing.lg, paddingBottom: spacing.xxxl },

    // Intro motif
    intro: { alignItems: 'center', marginBottom: spacing.xl },
    introText: { textAlign: 'center', marginTop: spacing.md },

    // Map card
    mapCard: { borderRadius: radius.lg, borderWidth: borderWidth.thin, overflow: 'hidden', marginBottom: spacing.xl },
    mapImage: { width: '100%', height: undefined, aspectRatio: 16 / 9 },
    mapTag: {
        position: 'absolute', bottom: spacing.md, left: spacing.md,
        flexDirection: 'row', alignItems: 'center', columnGap: spacing.sm,
        paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
        borderRadius: radius.pill, borderWidth: borderWidth.thin,
    },
    mapTagDot: { width: 6, height: 6, borderRadius: radius.pill },

    // "Get in touch" card
    contactCard: { borderRadius: radius.lg, borderWidth: borderWidth.thin, marginBottom: spacing.xl, overflow: 'hidden' },
    contactRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
    contactIcon: {
        width: 36, height: 36, borderRadius: radius.pill, borderWidth: borderWidth.thin,
        alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
    },
    contactText: { flex: 1 },
    rowDivider: { height: borderWidth.thin, marginHorizontal: spacing.md },

    // Enquiry form card
    formCard: { borderRadius: radius.lg, borderWidth: borderWidth.thin, padding: spacing.lg },
    formHeader: { paddingBottom: spacing.md, marginBottom: spacing.md, borderBottomWidth: borderWidth.thin },
    formFields: { rowGap: spacing.lg },
    privacyNote: { textAlign: 'center', marginTop: spacing.md },
});
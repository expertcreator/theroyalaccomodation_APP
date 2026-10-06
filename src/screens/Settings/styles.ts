import { StyleSheet } from 'react-native';
import { spacing, radius, borderWidth } from '../../theme';

export const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.xl2, paddingTop: spacing.lg, paddingBottom: spacing.xxxl },
    card: {
        borderRadius: radius.lg,
        borderWidth: borderWidth.thin,
        padding: spacing.lg,
        marginTop: spacing.md,
    },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowLeft: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.md },
    version: { textAlign: 'center', marginTop: spacing.xxxl },
});
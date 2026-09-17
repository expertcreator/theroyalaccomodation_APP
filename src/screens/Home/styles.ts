import { StyleSheet } from "react-native";
import { ITheme, spacing } from "../../theme";
import { moderateScale } from "react-native-size-matters";

export const createStyles = (theme: ITheme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.palette.background.default,
    },
    intro: {
        paddingHorizontal: spacing.xl2,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xl2,
        alignItems: 'center',
    },
    heading: { textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.sm },
    subtitle: { textAlign: 'center', maxWidth: moderateScale(300) },
    cards: { paddingHorizontal: spacing.xl2, rowGap: spacing.xl },
});
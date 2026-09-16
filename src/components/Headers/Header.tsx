import React from 'react';
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderWidth } from '../../theme';
import Text from '../Text/Text';
import Icon, { IconName } from '../Icon/Icon';

export type HeaderAction = { icon: IconName; onPress: () => void; label?: string };

type HeaderProps = {
    // Center (precedence: showBrand > title)
    showBrand?: boolean;          // renders the wordmark (Home/drawer)
    title?: string;               // centered uppercase title (Check Availability)
    overline?: string;            // small gold caps above title (optional)
    subtitle?: string;            // under the wordmark, e.g. "Ascot · Windsor"

    // Left (precedence: onBack > onClose)
    onBack?: () => void;          // chevron-left
    onClose?: () => void;         // X

    // Right (precedence: onMenu > rightActions)
    onMenu?: () => void;          // hamburger (opens drawer)
    rightActions?: HeaderAction[];// e.g. [{icon:'share'}, {icon:'bookmark'}]

    // Appearance
    variant?: 'solid' | 'overlay';// solid = cream bg; overlay = floats over hero
    bordered?: boolean;           // bottom hairline (default: true on solid)
    style?: StyleProp<ViewStyle>;
};

const BTN = 40; // circular button diameter (design: w-10 h-10)

const Header: React.FC<HeaderProps> = ({
    showBrand, title, overline, subtitle,
    onBack, onClose, onMenu, rightActions,
    variant = 'solid', bordered, style,
}) => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const p = theme.palette;
    const overlay = variant === 'overlay';

    const iconColor = overlay ? p.primary.contrastText : p.primary.main;
    const showBorder = bordered ?? (!overlay);

    const CircleButton = ({ icon, onPress, label }: HeaderAction) => (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label ?? icon}
            hitSlop={8}
            style={({ pressed }) => [
                styles.circle,
                overlay
                    ? { backgroundColor: 'rgba(0,0,0,0.28)' }
                    : { backgroundColor: p.background.card, borderWidth: borderWidth.thin, borderColor: p.borderColor },
                pressed && { transform: [{ scale: 0.94 }] },
            ]}
        >
            <Icon name={icon} color={iconColor} />
        </Pressable>
    );

    // ---- Left slot ----
    const renderLeft = () => {
        if (onBack) return <CircleButton icon="back" onPress={onBack} label="Go back" />;
        if (onClose) return <CircleButton icon="close" onPress={onClose} label="Close" />;
        return <View style={styles.circle} />; // spacer keeps center balanced
    };

    // ---- Right slot ----
    const renderRight = () => {
        if (onMenu) return <CircleButton icon="menu" onPress={onMenu} label="Open menu" />;
        if (rightActions?.length) {
            return (
                <View style={styles.actionRow}>
                    {rightActions.map((a, i) => (
                        <View key={i} style={i > 0 && { marginLeft: spacing.sm }}>
                            <CircleButton {...a} />
                        </View>
                    ))}
                </View>
            );
        }
        return <View style={styles.circle} />;
    };

    // ---- Center ----
    const renderCenter = () => {
        if (showBrand) {
            return (
                <View style={styles.center}>
                    <Text style={[typography.headerTitle, { color: p.accent.main }]}>
                        THE ROYAL ACCOMMODATION
                    </Text>
                    {!!subtitle && (
                        <Text style={[typography.overline, { color: p.text.placeHolder, marginTop: spacing.xxs }]}>
                            {subtitle}
                        </Text>
                    )}
                </View>
            );
        }
        if (title) {
            return (
                <View style={styles.center}>
                    {!!overline && (
                        <Text style={[typography.overline, { color: p.accent.main, marginBottom: spacing.xxs }]}>
                            {overline}
                        </Text>
                    )}
                    <Text numberOfLines={2} style={[typography.headerTitle, { color: overlay ? p.primary.contrastText : p.primary.main, textAlign: 'center' }]}>
                        {title}
                    </Text>
                </View>
            );
        }
        return <View style={styles.center} />;
    };

    return (
        <View
            style={[
                overlay ? styles.overlayWrap : { backgroundColor: p.background.default },
                { paddingTop: insets.top },
                showBorder && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.borderColor },
                style,
            ]}
        >
            <View style={styles.row}>
                {renderLeft()}
                {renderCenter()}
                {renderRight()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlayWrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, backgroundColor: 'transparent' },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl2,
        height: verticalScale(56),
    },
    circle: {
        width: moderateScale(BTN),
        height: moderateScale(BTN),
        borderRadius: moderateScale(BTN) / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionRow: { flexDirection: 'row', alignItems: 'center' },
    center: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
});

export default Header;
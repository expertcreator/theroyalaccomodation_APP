import React from 'react';
import { TouchableOpacity, View, StyleSheet, StyleProp, ViewStyle, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { typography, radius, spacing, borderWidth } from '../../theme';
import Text from '../Text/Text';
import Icon, { IconName } from '../Icon/Icon';

type Variant = 'primary' | 'outline';
type Size = 'md' | 'sm';

type Props = {
    title: string;
    onPress: () => void;
    variant?: Variant;
    size?: Size;               // 'md' (default) or 'sm'
    rightIcon?: IconName;
    fullWidth?: boolean;
    disabled?: boolean;
    loading?: boolean;         // ← NEW: show a spinner + loadingTitle, and block presses
    loadingTitle?: string;     // ← NEW: general label shown while loading
    style?: StyleProp<ViewStyle>;
};

const Button: React.FC<Props> = ({
    title, onPress, variant = 'primary', size = 'md', rightIcon,
    fullWidth = true, disabled, loading = false, loadingTitle = 'Please wait…', style,
}) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const isOutline = variant === 'outline';
    const isSmall = size === 'sm';

    const bg = isOutline ? p.transparent : p.primary.main;
    const textColor = isOutline ? p.text.primary : p.accent.light;

    const isDisabled = disabled || loading;   // can't press while loading

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={loading ? loadingTitle : title}
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            style={[
                styles.base,
                isSmall ? styles.sizeSm : styles.sizeMd,
                {
                    backgroundColor: bg, borderWidth: isOutline ? borderWidth.thin : 0,
                    borderColor: isOutline ? p.text.primary : p.primary.main,
                },
                fullWidth && { alignSelf: 'stretch' },
                isDisabled && { opacity: 0.5 },
                style,
            ]}
        >
            {loading && (
                <View style={{ marginRight: spacing.sm }}>
                    <ActivityIndicator size="small" color={textColor} />
                </View>
            )}
            <Text style={[isSmall ? typography.buttonSmall : typography.button, { color: textColor }]}>
                {loading ? loadingTitle : title}
            </Text>
            {!loading && rightIcon && (
                <View style={{ marginLeft: spacing.sm }}>
                    <Icon name={rightIcon} size={isSmall ? 14 : 16} color={p.accent.main} />
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.pill,
    },
    sizeMd: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
    sizeSm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
});

export default Button;
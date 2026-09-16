import React from 'react';
import { Pressable, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography, radius } from '../../theme';
import Text from '../Text/Text';
import Icon, { IconName } from '../Icon/Icon';

type Variant = 'primary' | 'outline';

type Props = {
    title: string;
    onPress: () => void;
    variant?: Variant;
    rightIcon?: IconName;      // e.g. 'arrow-right' (rendered gold)
    fullWidth?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
};

const Button: React.FC<Props> = ({
    title, onPress, variant = 'primary', rightIcon, fullWidth = true, disabled, style,
}) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const isOutline = variant === 'outline';

    const bg = isOutline ? p.transparent : p.primary.main;
    const textColor = isOutline ? p.primary.main : p.primary.contrastText;

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={title}
            style={({ pressed }) => [
                styles.base,
                { backgroundColor: bg, borderWidth: isOutline ? 1 : 0, borderColor: p.primary.main },
                fullWidth && { alignSelf: 'stretch' },
                pressed && { opacity: 0.85 },
                disabled && { opacity: 0.5 },
                style,
            ]}
        >
            <Text style={[typography.button, { color: textColor }]}>{title}</Text>
            {rightIcon && (
                <View style={{ marginLeft: moderateScale(8) }}>
                    <Icon name={rightIcon} size={16} color={p.accent.main} />
                </View>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.pill,
        paddingVertical: verticalScale(12),
        paddingHorizontal: moderateScale(16),
    },
});

export default Button;
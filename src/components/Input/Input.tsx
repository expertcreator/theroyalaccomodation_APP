import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radius, borderWidth } from '../../theme';
import Text from '../Text/Text';
import Icon, { IconName } from '../Icon/Icon';

type Props = TextInputProps & {
    label: string;
    labelRight?: React.ReactNode;
    value: string;
    onChangeText: (text: string) => void;
    error?: string | null;
    rightIcon?: IconName;            // e.g. 'eye' / 'eye-off'
    onRightIconPress?: () => void;
};

const Input: React.FC<Props> = ({
    label, labelRight, value, onChangeText, error, rightIcon, onRightIconPress, multiline, style, ...rest
}) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const [focused, setFocused] = useState(false);

    let borderColor = p.borderColor;
    if (error) borderColor = p.error.main;
    else if (focused) borderColor = p.accent.main;

    return (
        <View>
            <View style={styles.labelRow}>
                <Text style={[typography.overline, { color: p.text.placeHolder }]}>{label}</Text>
                {labelRight}
            </View>

            {/* Row wrapper so the icon sits inside the field */}
            <View
                style={[
                    styles.inputRow,
                    {
                        backgroundColor: focused ? p.background.card : p.background.default,
                        borderColor,
                    },
                    multiline && styles.multilineRow,
                ]}
            >
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    multiline={multiline}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholderTextColor={p.text.placeHolder}
                    style={[styles.input, typography.bodySmall, { color: p.text.primary }, multiline && styles.multiline, style]}
                    {...rest}
                />
                {rightIcon && (
                    <TouchableOpacity onPress={onRightIconPress} hitSlop={8} style={styles.rightIcon}>
                        <Icon name={rightIcon} size={18} color={p.text.placeHolder} />
                    </TouchableOpacity>
                )}
            </View>

            {!!error && (
                <Text style={[typography.caption, { color: p.error.main, marginTop: spacing.xs }]}>
                    {error}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: borderWidth.thin,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
    },
    multilineRow: { alignItems: 'flex-start' },
    input: {
        flex: 1,
        paddingVertical: spacing.md,
    },
    multiline: { minHeight: moderateScale(120), textAlignVertical: 'top' },
    rightIcon: { paddingLeft: spacing.sm },
});

export default Input;
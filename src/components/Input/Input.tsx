import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radius, borderWidth } from '../../theme';
import Text from '../Text/Text';

type Props = TextInputProps & {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    error?: string | null;   // shows red border + message when set
};

const Input: React.FC<Props> = ({ label, value, onChangeText, error, multiline, style, ...rest }) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const [focused, setFocused] = useState(false);

    // Border colour priority: error (red) → focused (gold) → default.
    let borderColor = p.borderColor;
    if (error) borderColor = p.error.main;
    else if (focused) borderColor = p.accent.main;

    return (
        <View>
            <Text style={[typography.overline, { color: p.text.placeHolder, marginBottom: spacing.xs }]}>
                {label}
            </Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                multiline={multiline}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholderTextColor={p.text.placeHolder}
                style={[
                    styles.input,
                    typography.bodySmall,
                    {
                        backgroundColor: focused ? p.background.card : p.background.default,
                        borderColor,
                        color: p.text.primary,
                    },
                    multiline && styles.multiline,
                    style,
                ]}
                {...rest}
            />
            {/* Inline error message */}
            {!!error && (
                <Text style={[typography.caption, { color: p.error.main, marginTop: spacing.xs }]}>
                    {error}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    input: {
        borderWidth: borderWidth.thin,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    multiline: { minHeight: moderateScale(120), textAlignVertical: 'top' },
});

export default Input;
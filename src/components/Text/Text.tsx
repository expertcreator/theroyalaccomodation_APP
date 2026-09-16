import React from 'react';
import {
    Text as RNText,
    TextProps as RNTextProps,
    StyleProp,
    StyleSheet,
    TextStyle,
} from 'react-native';
import { typography } from '../../theme';

type Props = RNTextProps & {
    style?: StyleProp<TextStyle>;
};

const Text: React.FC<Props> = ({ style, ...props }) => {
    const flatStyle = StyleSheet.flatten(style) || {};

    return (
        <RNText
            maxFontSizeMultiplier={1.2}
            {...props}
            style={[typography.bodySmall, flatStyle]}
        />
    );
};

export default Text;
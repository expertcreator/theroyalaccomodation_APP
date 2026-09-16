import React from 'react';
import {
    Text as RNText,
    TextProps as RNTextProps,
    StyleProp,
    StyleSheet,
    TextStyle,
} from 'react-native';

type Props = RNTextProps & {
    style?: StyleProp<TextStyle>;
};

const Text: React.FC<Props> = ({ style, ...props }) => {
    const flatStyle = StyleSheet.flatten(style) || {};

    return (
        <RNText
            maxFontSizeMultiplier={1.2}
            {...props}
            style={[
                {
                    fontSize: 14,
                },
                flatStyle,
            ]}
        />
    );
};

export default Text;
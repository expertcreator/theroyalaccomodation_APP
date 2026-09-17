import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { StyleSheet } from 'react-native';
import { spacing, borderWidth } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { withAlpha } from '../../utils/color';

// Reusable sticky bottom bar shell: absolute position, card bg, safe-area
// padding, and the champagne-gold hairline on top. Screens pass their own
// left content and right action as children.
type Props = {
    left: React.ReactNode;    // price / total block
    right: React.ReactNode;   // the action button
};

const FooterBar: React.FC<Props> = ({ left, right }) => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const p = theme.palette;

    return (
        <View style={[styles.bar, { backgroundColor: p.background.card, paddingBottom: insets.bottom + spacing.md }]}>
            <LinearGradient
                colors={['transparent', withAlpha(p.accent.main, 0.4), 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.hairline}
            />
            <View style={styles.row}>
                <View style={styles.leftCol}>{left}</View>
                <View style={styles.rightCol}>{right}</View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: spacing.md, paddingHorizontal: spacing.xl2 },
    hairline: { position: 'absolute', top: 0, left: 0, right: 0, height: borderWidth.thin },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: spacing.md },
    leftCol: { flexShrink: 1 },
    rightCol: { flexShrink: 0 },
});

export default FooterBar;
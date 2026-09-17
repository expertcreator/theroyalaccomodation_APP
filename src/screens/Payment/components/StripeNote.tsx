import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { typography } from '../../../theme';
import Text from '../../../components/Text/Text';
import Icon from '../../../components/Icon/Icon';
import { styles } from '../styles';

const StripeNote: React.FC = () => {
    const { theme } = useTheme();
    const p = theme.palette;

    return (
        <View style={[styles.card, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
            <View style={styles.stripeNote}>
                <Icon name="lock" size={14} color={p.accent.main} />
                <Text style={[typography.caption, { color: p.text.placeHolder, textAlign: 'center' }]}>
                    Secure payment by Stripe — card entry added at checkout integration.
                </Text>
            </View>
        </View>
    );
};

export default StripeNote;
import React from 'react';
import { View } from 'react-native';
import { CardForm, CardFormView } from '@stripe/stripe-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, radius, borderWidth, fontSizes } from '../../../theme';
import Text from '../../../components/Text/Text';
import Icon from '../../../components/Icon/Icon';
import Input from '../../../components/Input/Input';
import { styles } from '../styles';
import { moderateScale } from 'react-native-size-matters';

type Props = {
    cardholderName: string;
    onCardholderNameChange: (name: string) => void;
    onCardChange: (complete: boolean) => void;
};

const BADGES = ['VISA', 'MC', 'AMEX'];

const PaymentCard: React.FC<Props> = ({ cardholderName, onCardholderNameChange, onCardChange }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    return (
        <View style={[styles.card, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
            {/* Header: label + card badges */}
            <View style={styles.payHeader}>
                <View>
                    <Text style={[typography.overline, { color: p.accent.dark }]}>PAYMENT METHOD</Text>
                    <Text style={[typography.title, { color: p.text.primary, marginTop: spacing.xxs }]}>
                        Credit / Debit Card
                    </Text>
                </View>
            </View>

            {/* Cardholder name — NOT sensitive card data, so it's our own Input */}
            <View style={{ marginTop: spacing.lg }}>
                <Input
                    label="CARDHOLDER NAME"
                    value={cardholderName}
                    onChangeText={onCardholderNameChange}
                    placeholder="Name as shown on card"
                    autoCapitalize="words"
                />
            </View>

            {/* Stripe secure card fields (number / expiry / CVC) */}
            <View style={{ marginTop: spacing.md }}>
                <Text style={[typography.overline, { color: p.text.placeHolder, marginBottom: spacing.xs }]}>
                    CARD DETAILS
                </Text>
                <CardForm
                    onFormComplete={(details: CardFormView.Details) => onCardChange(details.complete)}
                    cardStyle={{
                        backgroundColor: p.background.default,   // cream, matches your Inputs
                        textColor: p.text.primary,               // near-black
                        placeholderColor: p.text.placeHolder,    // muted gray
                        borderColor: p.borderColor,              // warm border
                        borderWidth: borderWidth.thin,
                        borderRadius: radius.md,                         // matches your Input radius (radius.md)
                        fontSize: moderateScale(fontSizes.sm),
                    }}
                    style={styles.cardForm}
                />
            </View>

            {/* Security line */}
            <View style={styles.secureLine}>
                <Icon name="lock" size={13} color={p.accent.main} />
                <Text style={[typography.caption, { color: p.text.placeHolder }]}>
                    Safe & secure payments · SSL encrypted
                </Text>
            </View>
        </View>
    );
};

export default PaymentCard;
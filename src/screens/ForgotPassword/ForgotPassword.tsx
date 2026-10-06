import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { typography, spacing } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { authErrorMessage } from '../../firebase/authErrors';

import Text from '../../components/Text/Text';
import Header from '../../components/Headers/Header';
import Button from '../../components/Buttons/Button';
import Input from '../../components/Input/Input';
import Icon from '../../components/Icon/Icon';
import DiamondDivider from '../../components/Dividers/DiamondDivider';
import { styles } from './styles';
import { showToast } from '../../utils/ToastNotifier';
import { isValidEmail } from '../../utils/validation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ForgotPassword: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const { theme } = useTheme();
    const { resetPassword } = useAuth();
    const p = theme.palette;

    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | undefined>(undefined);
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const onSubmit = async () => {
        const mail = email.trim();
        if (!mail) { setError('Please enter your email'); return; }
        if (!isValidEmail(mail)) { setError('Please enter a valid email'); return; }

        try {
            setSubmitting(true);
            setError(undefined);
            await resetPassword(mail);
            setSent(true);
        } catch (err: any) {
            // Don't reveal whether an account exists — treat "not found" as success.
            if (err?.code === 'auth/user-not-found') {
                setSent(true);
            } else {
                showToast('danger', authErrorMessage(err));
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: p.background.default }]}>
            <Header onBack={() => navigation.goBack()} />

            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                bottomOffset={spacing.xl}
            >
                <View style={[styles.card, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
                    <View style={styles.titleBlock}>
                        <View style={styles.secureRow}>
                            <Icon name="lock" size={13} color={p.accent.dark} />
                            <Text style={[typography.overline, { color: p.accent.dark }]}>ACCOUNT RECOVERY</Text>
                        </View>
                        <Text style={[typography.h1, { color: p.text.primary, textAlign: 'center' }]}>
                            Reset Password
                        </Text>
                        <View style={{ marginTop: spacing.md }}>
                            <DiamondDivider />
                        </View>
                    </View>

                    {sent ? (
                        <View style={styles.sentBlock}>
                            <View style={[styles.checkRing, { borderColor: p.accent.main, backgroundColor: p.background.default }]}>
                                <Icon name="check" size={24} color={p.accent.main} />
                            </View>
                            <Text style={[typography.title, { color: p.text.primary, textAlign: 'center', marginTop: spacing.lg }]}>
                                Check your inbox
                            </Text>
                            <Text style={[typography.bodySmall, { color: p.text.placeHolder, textAlign: 'center', marginTop: spacing.sm }]}>
                                If an account exists for {email.trim()}, we've sent a link to reset your password. It can take a few minutes to arrive.
                            </Text>
                            <View style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}>
                                <Button title="Back to Sign In" rightIcon="arrow-right" onPress={() => navigation.goBack()} />
                            </View>
                        </View>
                    ) : (
                        <View style={styles.fields}>
                            <Text style={[typography.bodySmall, { color: p.text.placeHolder, textAlign: 'center' }]}>
                                Enter the email linked to your account and we'll send you a link to reset your password.
                            </Text>

                            <Input
                                label="EMAIL ADDRESS"
                                value={email}
                                onChangeText={(t) => { setEmail(t); if (error) setError(undefined); }}
                                placeholder="e.g. lord.alexander@domain.co.uk"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                error={error}
                            />

                            <Button title="Send Reset Link" rightIcon="arrow-right" onPress={onSubmit} loading={submitting} />
                        </View>
                    )}
                </View>
            </KeyboardAwareScrollView>
        </View>
    );
};

export default ForgotPassword;
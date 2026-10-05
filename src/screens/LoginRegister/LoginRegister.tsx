import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { typography, spacing } from '../../theme';
import { withAlpha } from '../../utils/color';
import { getPropertyById } from '../../constants/data';
import type { RootStackParamList } from '../../navigation/types';
import { STACK_ROUTES, DRAWER_ROUTES } from '../../navigation/routes';
import { authErrorMessage } from '../../firebase/authErrors';

import Text from '../../components/Text/Text';
import Header from '../../components/Headers/Header';
import Button from '../../components/Buttons/Button';
import Input from '../../components/Input/Input';
import Icon from '../../components/Icon/Icon';
import DiamondDivider from '../../components/Dividers/DiamondDivider';
import StaySummary from './components/StaySummary';
import { styles } from './styles';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { showToast } from '../../utils/ToastNotifier';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ScreenRoute = RouteProp<RootStackParamList, typeof STACK_ROUTES.LoginRegister>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Mode = 'login' | 'register';
type Errors = { firstName?: string; lastName?: string; email?: string; country?: string; password?: string };

const LoginRegister: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const { theme } = useTheme();
  const { signIn, signUp, resetPassword } = useAuth();
  const p = theme.palette;

  // Entry context — booking shows the "Your Stay" card and returns to Payment.
  const entry = route.params.entry;
  const booking = route.params.entry === 'booking' ? route.params.booking : undefined;
  const property = booking ? getPropertyById(booking.propertyId) : undefined;

  const [mode, setMode] = useState<Mode>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false); // button loader

  const clearError = (key: keyof Errors) => setErrors((e) => ({ ...e, [key]: undefined }));

  const validate = (): boolean => {
    const next: Errors = {};
    if (mode === 'register') {
      if (!firstName.trim()) next.firstName = 'Please enter your first name';
      if (!lastName.trim()) next.lastName = 'Please enter your last name';
      if (!country.trim()) next.country = 'Please enter your country';
    }
    if (!email.trim()) next.email = 'Please enter your email';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Please enter a valid email';
    if (!password) next.password = 'Please enter your password';
    else if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return !next.firstName && !next.lastName && !next.email && !next.country && !next.password;
  };

  // Send a password-reset email. Needs a valid email in the field first.
  const onForgotPassword = async () => {
    const mail = email.trim();
    if (!mail || !EMAIL_RE.test(mail)) {
      setErrors((e) => ({ ...e, email: 'Enter your email first to reset your password' }));
      return;
    }
    try {
      await resetPassword(mail);
      showToast('success', 'Password reset email sent. Check your inbox.');
    } catch (err) {
      showToast('danger', authErrorMessage(err));
    }
  };

  const onSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);

      if (mode === 'register') {
        // Creates the Auth account + the Firestore profile, and signs the user in.
        await signUp({
          firstName,
          lastName,
          email,
          phone: phone.trim() || null,
          country: country.trim() || 'United Kingdom',
          password,
        });
      } else {
        await signIn(email, password);
      }

      // Where to go next. `replace` so Back doesn't return to this screen.
      if (entry === 'booking' && booking) {
        navigation.replace(STACK_ROUTES.PaymentReview, booking);
      } else {
        navigation.replace(STACK_ROUTES.DrawerRoot, { screen: DRAWER_ROUTES.Home });
      }
    } catch (err) {
      // Bad password, email already used, no network, etc.
      showToast('danger', authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const goToContact = () =>
    navigation.navigate(STACK_ROUTES.DrawerRoot, { screen: DRAWER_ROUTES.Contact });

  const isRegister = mode === 'register';

  return (
    <View style={[styles.container, { backgroundColor: p.background.default }]}>
      <Header onBack={() => navigation.goBack()} />

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bottomOffset={spacing.xl}
      >
        {/* Your Stay — booking context only */}
        {property && booking && <StaySummary property={property} booking={booking} />}

        <View style={[styles.card, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
          {/* Title */}
          <View style={styles.titleBlock}>
            <View style={styles.secureRow}>
              <Icon name="lock" size={13} color={p.accent.dark} />
              <Text style={[typography.overline, { color: p.accent.dark }]}>SECURE BOOKING</Text>
            </View>
            <Text style={[typography.h1, { color: p.text.primary, textAlign: 'center' }]}>
              Sign In or Register
            </Text>
            <Text style={[typography.bodySmall, styles.subtitle, { color: p.text.placeHolder }]}>
              {entry === 'booking'
                ? "You'll need an account to complete your booking."
                : 'Sign in to manage your bookings.'}
            </Text>
            <View style={{ marginTop: spacing.md }}>
              <DiamondDivider />
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {(['login', 'register'] as Mode[]).map((m) => {
              const active = m === mode;
              return (
                <TouchableOpacity key={m} onPress={() => { setMode(m); setErrors({}); }} activeOpacity={0.7} style={styles.tab}>
                  <Text style={[typography.label, { color: active ? p.text.primary : p.text.placeHolder }]}>
                    {m === 'login' ? 'SIGN IN' : 'REGISTER'}
                  </Text>
                  <View style={[styles.tabBar, { backgroundColor: active ? p.accent.main : 'transparent' }]} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Form */}
          <View style={styles.fields}>
            {isRegister && (
              <>
                <Input
                  label="FIRST NAME"
                  value={firstName}
                  onChangeText={(t) => { setFirstName(t); if (errors.firstName) clearError('firstName'); }}
                  placeholder="e.g. Alexander"
                  error={errors.firstName}
                />
                <Input
                  label="LAST NAME"
                  value={lastName}
                  onChangeText={(t) => { setLastName(t); if (errors.lastName) clearError('lastName'); }}
                  placeholder="e.g. Windsor"
                  error={errors.lastName}
                />
              </>
            )}

            <Input
              label="EMAIL ADDRESS"
              value={email}
              onChangeText={(t) => { setEmail(t); if (errors.email) clearError('email'); }}
              placeholder="e.g. lord.alexander@domain.co.uk"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            {isRegister && (
              <>
                <Input
                  label="PHONE"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. +44 7700 900000"
                  keyboardType="phone-pad"
                />
                <Input
                  label="COUNTRY"
                  value={country}
                  onChangeText={(t) => { setCountry(t); if (errors.country) clearError('country'); }}
                  placeholder="e.g. United Kingdom"
                  error={errors.country}
                />
              </>
            )}

            <Input
              label="PASSWORD"
              labelRight={
                !isRegister ? (
                  <TouchableOpacity onPress={onForgotPassword} hitSlop={8}>
                    <Text style={[typography.overline, { color: p.accent.dark }]}>FORGOT?</Text>
                  </TouchableOpacity>
                ) : undefined
              }
              value={password}
              onChangeText={(t) => { setPassword(t); if (errors.password) clearError('password'); }}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              rightIcon={showPassword ? 'eye-off' : 'eye'}
              onRightIconPress={() => setShowPassword((s) => !s)}
              error={errors.password}
            />

            <View style={{ marginTop: spacing.xs }}>
              <Button title="Continue" rightIcon="arrow-right" onPress={onSubmit} loading={submitting} />
            </View>
          </View>

          {/* Footer badges */}
          <View style={styles.footer}>
            <View style={[styles.badge, { backgroundColor: withAlpha(p.accent.main, 0.12) }]}>
              <Icon name="shield" size={13} color={p.accent.dark} />
              <Text style={[typography.overline, { color: p.text.primary }]}>SECURE & ENCRYPTED</Text>
            </View>
            <Text style={[typography.caption, { color: p.text.placeHolder, textAlign: 'center' }]}>
              Your details are encrypted and kept private.
            </Text>
          </View>

          {/* Need help → Contact */}
          <TouchableOpacity
            onPress={goToContact}
            activeOpacity={0.7}
            style={[styles.helpRow, { backgroundColor: p.background.card, borderColor: p.borderColor }]}
          >
            <View style={styles.helpLeft}>
              <Icon name="phone" size={16} color={p.accent.main} />
              <Text style={[typography.label, { color: p.text.primary }]}>Need help booking?</Text>
            </View>
            <View style={styles.helpRight}>
              <Text style={[typography.overline, { color: p.accent.dark }]}>CONTACT</Text>
              <Icon name="external-link" size={12} color={p.accent.dark} />
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default LoginRegister;
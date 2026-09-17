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

import Text from '../../components/Text/Text';
import Header from '../../components/Headers/Header';
import Button from '../../components/Buttons/Button';
import Input from '../../components/Input/Input';
import Icon from '../../components/Icon/Icon';
import DiamondDivider from '../../components/Dividers/DiamondDivider';
import StaySummary from './components/StaySummary';
import { styles } from './styles';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ScreenRoute = RouteProp<RootStackParamList, typeof STACK_ROUTES.LoginRegister>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Mode = 'login' | 'register';
type Errors = { name?: string; email?: string; password?: string };

const LoginRegister: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const { theme } = useTheme();
  const { signIn } = useAuth();
  const p = theme.palette;

  // Entry context — booking shows the "Your Stay" card and returns to Payment.
  const entry = route.params.entry;
  const booking = route.params.entry === 'booking' ? route.params.booking : undefined;
  const property = booking ? getPropertyById(booking.propertyId) : undefined;

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [errors, setErrors] = useState<Errors>({});

  const clearError = (key: keyof Errors) => setErrors((e) => ({ ...e, [key]: undefined }));

  const validate = (): boolean => {
    const next: Errors = {};
    if (mode === 'register' && !name.trim()) next.name = 'Please enter your name';
    if (!email.trim()) next.email = 'Please enter your email';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Please enter a valid email';
    if (!password) next.password = 'Please enter your password';
    else if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return !next.name && !next.email && !next.password;
  };

  const onForgotPassword = () => {
    // Static phase: no-op / placeholder. Real reset comes with Firebase Auth.
    // Could show a small confirm modal here later.
  };

  const onSubmit = async () => {
    if (!validate()) return;

    // Static phase: just sign in locally. Real auth (Firebase) comes later.
    const displayName = mode === 'register' ? name.trim() : email.split('@')[0];
    await signIn({ name: displayName, email: email.trim() });

    // Branch on where the user came from. `replace` so back doesn't return here.
    if (entry === 'booking' && booking) {
      navigation.replace(STACK_ROUTES.PaymentReview, booking);
    } else {
      navigation.replace(STACK_ROUTES.DrawerRoot, { screen: DRAWER_ROUTES.Home });
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
            <Text style={[typography.h1, { color: p.primary.main, textAlign: 'center' }]}>
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
                  <Text style={[typography.label, { color: active ? p.primary.main : p.text.placeHolder }]}>
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
              <Input
                label="FULL NAME"
                value={name}
                onChangeText={(t) => { setName(t); if (errors.name) clearError('name'); }}
                placeholder="e.g. Alexander Windsor"
                error={errors.name}
              />
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
              <Input
                label="PHONE"
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. +44 7700 900000"
                keyboardType="phone-pad"
              />
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

            {/* Keep me signed in */}
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setKeepSignedIn((v) => !v)} activeOpacity={0.7}>
              <View style={[styles.checkbox, { borderColor: p.borderColor, backgroundColor: keepSignedIn ? p.primary.main : 'transparent' }]}>
                {keepSignedIn && <Icon name="check" size={12} color={p.primary.contrastText} />}
              </View>
              <Text style={[typography.caption, { color: p.text.primary }]}>Keep me signed in on this device</Text>
            </TouchableOpacity>

            <View style={{ marginTop: spacing.xs }}>
              <Button title="Continue" rightIcon="arrow-right" onPress={onSubmit} />
            </View>
          </View>

          {/* Footer badges */}
          <View style={styles.footer}>
            <View style={[styles.badge, { backgroundColor: withAlpha(p.accent.main, 0.12) }]}>
              <Icon name="shield" size={13} color={p.accent.dark} />
              <Text style={[typography.overline, { color: p.primary.main }]}>SECURE & ENCRYPTED</Text>
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
              <Text style={[typography.label, { color: p.primary.main }]}>Need help booking?</Text>
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
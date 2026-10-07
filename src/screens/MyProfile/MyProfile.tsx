import React, { useState } from 'react';
import { View, Image, TouchableOpacity, BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { typography, spacing } from '../../theme';
import { formatMonthShort } from '../../utils/date';
import type { DrawerParamList, RootStackParamList } from '../../navigation/types';
import { STACK_ROUTES } from '../../navigation/routes';

import Text from '../../components/Text/Text';
import Header from '../../components/Headers/Header';
import Input from '../../components/Input/Input';
import Button from '../../components/Buttons/Button';
import Icon from '../../components/Icon/Icon';
import SectionEyebrow from '../../components/SectionEyebrow/SectionEyebrow';
import DiamondDivider from '../../components/Dividers/DiamondDivider';
import ConfirmModal from '../../components/Modals/ConfirmModal';
import { styles } from './styles';
import { showToast } from '../../utils/ToastNotifier';
import { moderateScale } from 'react-native-size-matters';
import { COUNTRIES } from '../../constants/countries';
import Select from '../../components/Dropdown/Select';

type Nav = DrawerNavigationProp<DrawerParamList>;

const MyProfile: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const { theme } = useTheme();
    const { profile, updateProfile, isLoggedIn, emailVerified, resendVerification } = useAuth();
    const p = theme.palette;

    const addr = profile?.address;

    // Editable fields, seeded from the live profile.
    const [firstName, setFirstName] = useState(profile?.firstName ?? '');
    const [lastName, setLastName] = useState(profile?.lastName ?? '');
    const [phone, setPhone] = useState(profile?.phone ?? '');
    const [line1, setLine1] = useState(addr?.line1 ?? '');
    const [line2, setLine2] = useState(addr?.line2 ?? '');
    const [city, setCity] = useState(addr?.city ?? '');
    const [county, setCounty] = useState(addr?.county ?? '');
    const [postCode, setPostCode] = useState(addr?.postCode ?? '');
    const [country, setCountry] = useState(addr?.country ?? 'United Kingdom');

    const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; country?: string }>({});
    const [saving, setSaving] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

    const email = profile?.email ?? '';

    // "Member since Jan 2026" from the account's created date.
    const createdDate = profile?.createdAt?.toDate?.() ?? null;
    const memberSince = createdDate ? `${formatMonthShort(createdDate)} ${createdDate.getFullYear()}` : null;

    // Save enables only when something actually changed.
    const isDirty =
        firstName !== (profile?.firstName ?? '') ||
        lastName !== (profile?.lastName ?? '') ||
        phone !== (profile?.phone ?? '') ||
        line1 !== (addr?.line1 ?? '') ||
        line2 !== (addr?.line2 ?? '') ||
        city !== (addr?.city ?? '') ||
        county !== (addr?.county ?? '') ||
        postCode !== (addr?.postCode ?? '') ||
        country !== (addr?.country ?? 'United Kingdom');

    const initials = `${firstName.trim()[0] ?? ''}${lastName.trim()[0] ?? ''}`.toUpperCase()
        || (email[0] ?? '?').toUpperCase();

    // Photo editing is disabled until Firebase Storage is set up.
    const onPickPhoto = () => showToast('normal', 'Profile photos are coming soon.');

    const onResendVerification = async () => {
        try {
            await resendVerification();
            showToast('success', 'Verification email sent. Check your inbox.');
        } catch (error) {
            showToast('danger', 'Could not send the verification email.');
        }
    };

    const onSave = async () => {
        if (!firstName.trim()) { setErrors({ firstName: 'Please enter your first name' }); return; }
        if (!lastName.trim()) { setErrors({ lastName: 'Please enter your last name' }); return; }
        if (!country.trim()) { setErrors({ country: 'Please enter your country' }); return; }

        try {
            setSaving(true);
            await updateProfile({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phone.trim() || null,
                address: {
                    line1: line1.trim() || null,
                    line2: line2.trim() || null,
                    city: city.trim() || null,
                    county: county.trim() || null,
                    postCode: postCode.trim() || null,
                    country: country.trim(),
                },
            });
            showToast('success', 'Profile updated');
        } catch {
            showToast('danger', 'Could not update your profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const stayOnScreen = () => setShowLeaveConfirm(false);

    const onBackPress = () => {
        if (isDirty) setShowLeaveConfirm(true);
        else navigation.goBack();
    };

    const resetToProfile = () => {
        setFirstName(profile?.firstName ?? '');
        setLastName(profile?.lastName ?? '');
        setPhone(profile?.phone ?? '');
        setLine1(addr?.line1 ?? '');
        setLine2(addr?.line2 ?? '');
        setCity(addr?.city ?? '');
        setCounty(addr?.county ?? '');
        setPostCode(addr?.postCode ?? '');
        setCountry(addr?.country ?? 'United Kingdom');
        setErrors({});
    };

    const discardAndLeave = () => {
        setShowLeaveConfirm(false);
        resetToProfile();
        navigation.goBack();
    };

    useFocusEffect(
        React.useCallback(() => {
            resetToProfile();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [profile])
    );

    useFocusEffect(
        React.useCallback(() => {
            const onHardwareBack = () => {
                if (isDirty) { setShowLeaveConfirm(true); return true; }
                return false;
            };
            const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
            return () => sub.remove();
        }, [isDirty])
    );

    // Signed-out guard — a guest can reach this screen, so offer sign-in.
    if (!isLoggedIn) {
        return (
            <View style={[styles.container, { backgroundColor: p.background.default }]}>
                <Header title="My Profile" onBack={() => navigation.goBack()} />
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl2, rowGap: spacing.lg }}>
                    <Text style={[typography.title, { color: p.text.primary, textAlign: 'center' }]}>
                        Sign in to view your profile
                    </Text>
                    <Button
                        title="Sign In"
                        rightIcon="arrow-right"
                        onPress={() =>
                            navigation
                                .getParent<NativeStackNavigationProp<RootStackParamList>>()
                                ?.navigate(STACK_ROUTES.LoginRegister, { entry: 'drawer' })
                        }
                    />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: p.background.default }]}>
            <Header title="My Profile" onBack={onBackPress} />

            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                bottomOffset={spacing.xl}
            >
                {/* Avatar + name + email + status */}
                <View style={styles.hero}>
                    <TouchableOpacity activeOpacity={0.85} onPress={onPickPhoto} style={styles.avatarWrap}>
                        <View style={[styles.avatar, { backgroundColor: p.primary.main, borderColor: p.accent.main }]}>
                            {profile?.photoURL ? (
                                <Image source={{ uri: profile.photoURL }} style={styles.avatarImage} resizeMode="cover" />
                            ) : (
                                <Text style={{ color: p.accent.light, fontSize: 22, letterSpacing: 2 }}>{initials}</Text>
                            )}
                        </View>
                        <View style={[styles.cameraBadge, { backgroundColor: p.accent.main, borderColor: p.background.default }]}>
                            <Icon name="camera" size={13} color={p.primary.main} />
                        </View>
                    </TouchableOpacity>

                    <Text style={[typography.title, styles.name, { color: p.text.primary }]}>
                        {`${firstName} ${lastName}`.trim() || 'Your Name'}
                    </Text>
                    <Text style={[typography.caption, styles.email, { color: p.text.placeHolder }]}>
                        {email}
                    </Text>

                    {/* Email verification status */}
                    {emailVerified ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: spacing.xxs, marginTop: spacing.xs }}>
                            <Icon name="check" size={12} color={p.accent.dark} />
                            <Text style={[typography.overline, { color: p.accent.dark }]}>EMAIL VERIFIED</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={onResendVerification}
                            hitSlop={8}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: moderateScale(5), marginTop: spacing.xs }}
                        >
                            <Icon name="alert" size={12} color={p.warning.main} />
                            <Text style={[typography.overline, { color: p.warning.main, }]}>
                                EMAIL NOT VERIFIED ·{' '}
                                <Text style={[typography.overline, { textDecorationLine: 'underline', color: p.accent.dark }]}>RESEND</Text>
                            </Text>
                        </TouchableOpacity>
                    )}

                    {memberSince && (
                        <Text style={[typography.caption, { color: p.text.placeHolder, marginTop: spacing.xxs }]}>
                            Member since {memberSince}
                        </Text>
                    )}
                </View>

                <DiamondDivider />

                {/* Account details */}
                <View style={{ marginTop: spacing.lg }}>
                    <SectionEyebrow label="Account Details" />

                    <View style={styles.fields}>
                        <Input
                            label="FIRST NAME"
                            value={firstName}
                            onChangeText={(t) => { setFirstName(t); if (errors.firstName) setErrors((e) => ({ ...e, firstName: undefined })); }}
                            placeholder="e.g. Alexander"
                            error={errors.firstName}
                        />
                        <Input
                            label="LAST NAME"
                            value={lastName}
                            onChangeText={(t) => { setLastName(t); if (errors.lastName) setErrors((e) => ({ ...e, lastName: undefined })); }}
                            placeholder="e.g. Windsor"
                            error={errors.lastName}
                        />
                        {/* Email is read-only — account identity + bookings match key. */}
                        <View>
                            <Input
                                label="EMAIL ADDRESS"
                                value={email}
                                onChangeText={() => { }}
                                editable={false}
                                selectTextOnFocus={false}
                                style={{ color: p.text.placeHolder }}
                            />
                            <Text style={[typography.caption, { color: p.text.placeHolder, marginTop: spacing.xs }]}>
                                Your email can't be changed — it's linked to your account and bookings.
                            </Text>
                        </View>

                        <Input
                            label="PHONE"
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="e.g. +44 7700 900000"
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* Address */}
                <View style={{ marginTop: spacing.xl }}>
                    <SectionEyebrow label="Address" />

                    <View style={styles.fields}>
                        <Input label="ADDRESS LINE 1" value={line1} onChangeText={setLine1} placeholder="e.g. 12 Kingsway" />
                        <Input label="ADDRESS LINE 2" value={line2} onChangeText={setLine2} placeholder="Apartment, suite, etc. (optional)" />
                        <Input label="CITY" value={city} onChangeText={setCity} placeholder="e.g. London" />
                        <Input label="COUNTY" value={county} onChangeText={setCounty} placeholder="e.g. Greater London" />
                        <Input label="POST CODE" value={postCode} onChangeText={setPostCode} placeholder="e.g. SW1A 1AA" autoCapitalize="characters" />
                        <Select
                            label="COUNTRY"
                            value={country}
                            options={COUNTRIES}
                            searchable
                            onSelect={(c) => { setCountry(c); if (errors.country) setErrors((e) => ({ ...e, country: undefined })); }}
                            error={errors.country}
                        />
                    </View>
                </View>

                <View style={styles.saveWrap}>
                    <Button title="Save Changes" rightIcon="check" disabled={!isDirty || saving} loading={saving} onPress={onSave} />
                </View>
            </KeyboardAwareScrollView>

            <ConfirmModal
                visible={showLeaveConfirm}
                title="Discard Changes?"
                message="You have unsaved changes. If you leave now, they'll be lost."
                cancelBtnText="Keep Editing"
                confirmBtnText="Discard"
                onCancel={stayOnScreen}
                onConfirm={discardAndLeave}
            />
        </View>
    );
};

export default MyProfile;
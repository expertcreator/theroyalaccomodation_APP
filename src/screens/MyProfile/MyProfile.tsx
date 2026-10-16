import React, { useEffect, useRef, useState } from 'react';
import { View, Image, TouchableOpacity, BackHandler, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { typography, spacing } from '../../theme';
import { formatMonthShort } from '../../utils/date';
import { withAlpha } from '../../utils/color';
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
import OptionsModal from '../../components/Modals/OptionsModal';
import EmptyState from '../../components/EmptyState/EmptyState';
import { styles } from './styles';
import { showToast } from '../../utils/ToastNotifier';
import { moderateScale } from 'react-native-size-matters';
import { COUNTRIES } from '../../constants/countries';
import Select from '../../components/Dropdown/Select';
import { formatPhoneDisplay, isValidPhone, toE164 } from '../../utils/phone';
import { pickAvatar } from '../../utils/photo';
import { uploadAvatar, deleteAvatar } from '../../firebase/avatar';

type Nav = DrawerNavigationProp<DrawerParamList>;

interface IFormErros {
    firstName?: string;
    lastName?: string;
    country?: string;
    phone?: string
}

const MyProfile: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const { theme } = useTheme();
    const { profile, updateProfile, refreshProfile, isLoggedIn, emailVerified, resendVerification, reloadEmailVerified } = useAuth();
    const p = theme.palette;

    const addr = profile?.address;

    // Editable fields, seeded from the live profile.
    const [firstName, setFirstName] = useState(profile?.firstName ?? '');
    const [lastName, setLastName] = useState(profile?.lastName ?? '');
    const [phone, setPhone] = useState(formatPhoneDisplay(profile?.phone ?? '', addr?.country ?? 'United Kingdom'));
    const [line1, setLine1] = useState(addr?.line1 ?? '');
    const [line2, setLine2] = useState(addr?.line2 ?? '');
    const [city, setCity] = useState(addr?.city ?? '');
    const [county, setCounty] = useState(addr?.county ?? '');
    const [postCode, setPostCode] = useState(addr?.postCode ?? '');
    const [country, setCountry] = useState(addr?.country ?? 'United Kingdom');

    const [errors, setErrors] = useState<IFormErros>({});
    const [saving, setSaving] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [retrying, setRetrying] = useState(false); // "Try Again" in progress
    const [photoBusy, setPhotoBusy] = useState(false); // uploading or removing the photo
    const [refreshing, setRefreshing] = useState(false); // pull-to-refresh in progress
    const [showPhotoOptions, setShowPhotoOptions] = useState(false); // Choose / Remove photo modal

    const email = profile?.email ?? '';

    // "Member since Jan 2026" from the account's created date.
    const createdDate = profile?.createdAt?.toDate?.() ?? null;
    const memberSince = createdDate ? `${formatMonthShort(createdDate)} ${createdDate.getFullYear()}` : null;

    // Save enables only when something actually changed.
    const isDirty =
        firstName !== (profile?.firstName ?? '') ||
        lastName !== (profile?.lastName ?? '') ||
        toE164(phone, country) !== (profile?.phone ?? null) ||
        line1 !== (addr?.line1 ?? '') ||
        line2 !== (addr?.line2 ?? '') ||
        city !== (addr?.city ?? '') ||
        county !== (addr?.county ?? '') ||
        postCode !== (addr?.postCode ?? '') ||
        country !== (addr?.country ?? 'United Kingdom');

    const initials = `${firstName.trim()[0] ?? ''}${lastName.trim()[0] ?? ''}`.toUpperCase()
        || (email[0] ?? '?').toUpperCase();

    /* ---------------- Profile photo (Firebase Storage: users/{uid}/avatar.jpg) ---------------- */

    // Pick from the gallery (square crop), upload, then save the URL on the profile.
    const choosePhoto = async () => {
        if (!profile) return;
        const path = await pickAvatar();
        if (!path) return; // cancelled, or no permission (pickAvatar shows the toast)
        setPhotoBusy(true);
        try {
            const url = await uploadAvatar(profile.uid, path);
            await updateProfile({ photoURL: url });
            showToast('success', 'Profile photo updated.');
        } catch (e) {
            console.warn('Avatar upload failed', e);
            showToast('danger', "Couldn't update your photo. Please try again.");
        } finally {
            setPhotoBusy(false);
        }
    };

    // Clear the photo from the profile first (what the guest sees), then delete the file.
    const removePhoto = async () => {
        if (!profile) return;
        setPhotoBusy(true);
        try {
            await updateProfile({ photoURL: null });
            showToast('success', 'Profile photo removed.');
        } catch (e) {
            console.warn('Avatar remove failed', e);
            showToast('danger', "Couldn't remove your photo. Please try again.");
            setPhotoBusy(false);
            return;
        }
        // If this fails the file just stays until the next upload overwrites it,
        // or the account is deleted (which deletes it too).
        await deleteAvatar(profile.uid).catch((e) => console.warn('Avatar file delete failed', e));
        setPhotoBusy(false);
    };

    // Tap on the avatar: no photo yet → straight to the gallery; otherwise choose or remove.
    const onPickPhoto = () => {
        if (!profile || photoBusy) return;
        if (!profile.photoURL) {
            choosePhoto();
            return;
        }
        setShowPhotoOptions(true);
    };

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
        if (phone.trim() && !isValidPhone(phone, country)) { setErrors({ phone: 'Please enter a valid phone number' }); return; }

        try {
            setSaving(true);
            await updateProfile({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: toE164(phone, country),
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

    // "Try Again" when the profile couldn't be loaded.
    // If it works, the form appears with the guest's details filled in.
    const onTryAgain = async () => {
        setRetrying(true);
        try {
            await refreshProfile();
        } catch {
            showToast('danger', "Still couldn't load your details. Check your connection.");
        } finally {
            setRetrying(false);
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
        setPhone(formatPhoneDisplay(profile?.phone ?? '', addr?.country ?? 'United Kingdom'));
        setLine1(addr?.line1 ?? '');
        setLine2(addr?.line2 ?? '');
        setCity(addr?.city ?? '');
        setCounty(addr?.county ?? '');
        setPostCode(addr?.postCode ?? '');
        setCountry(addr?.country ?? 'United Kingdom');
        setErrors({});
    };

    /* ---------------- Keep the form in step with the live profile ---------------- */

    // The values a profile puts in the form, in field order (phone as displayed).
    const formValuesOf = (prof: typeof profile) => {
        const a = prof?.address;
        const c = a?.country ?? 'United Kingdom';
        return [
            prof?.firstName ?? '', prof?.lastName ?? '', formatPhoneDisplay(prof?.phone ?? '', c),
            a?.line1 ?? '', a?.line2 ?? '', a?.city ?? '', a?.county ?? '', a?.postCode ?? '', c,
        ];
    };
    const formValues = [firstName, lastName, phone, line1, line2, city, county, postCode, country];
    const formSetters = [setFirstName, setLastName, setPhone, setLine1, setLine2, setCity, setCounty, setPostCode, setCountry];

    // The profile the form was last filled from.
    const filledFrom = useRef(profile);

    // The profile changed (edited on another phone, or saved here): refill every
    // field the guest hasn't edited; keep the ones they're editing. So Save never
    // quietly undoes a change made on the other phone to a field they didn't touch.
    useEffect(() => {
        if (!profile || profile === filledFrom.current) return;
        const before = formValuesOf(filledFrom.current);
        const after = formValuesOf(profile);
        formValues.forEach((value, i) => {
            if (value === before[i]) formSetters[i](after[i]);   // not edited → take the new value
        });
        filledFrom.current = profile;
        // Only react to a new profile, not to typing.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile]);

    // Pull down: read the profile again and re-check Email Verified (which lives in
    // Firebase Auth, so the live listener can't see it).
    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([refreshProfile(), reloadEmailVerified()]);
        } catch {
            showToast('danger', "Couldn't refresh your details. Check your connection.");
        } finally {
            setRefreshing(false);
        }
    };

    const discardAndLeave = () => {
        setShowLeaveConfirm(false);
        resetToProfile();
        navigation.goBack();
    };

    // Coming back to the screen: start from the saved profile. Only on focus —
    // profile changes while the screen is open are handled by the effect above,
    // which keeps unsaved edits. (Refs, so this callback never has to change.)
    const resetRef = useRef(resetToProfile);
    resetRef.current = resetToProfile;
    const profileRef = useRef(profile);
    profileRef.current = profile;
    useFocusEffect(
        React.useCallback(() => {
            resetRef.current();
            filledFrom.current = profileRef.current;
        }, [])
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

    // Signed in, but the profile hasn't loaded (e.g. offline at start-up).
    // Show a message instead of an empty form, so blank fields can never be
    // saved over the guest's real details. The form appears once it loads.
    if (!profile) {
        return (
            <View style={[styles.container, { backgroundColor: p.background.default }]}>
                <Header title="My Profile" onBack={() => navigation.goBack()} />
                <View style={styles.scrollContent}>
                    {retrying ? (
                        <ActivityIndicator size="large" color={p.primary.main} style={{ marginTop: spacing.xxxl }} />
                    ) : (
                        <EmptyState
                            icon="alert"
                            title="Couldn't Load Your Details"
                            message="Please check your connection and try again."
                            actionLabel="Try Again"
                            onAction={onTryAgain}
                            helpText="Need assistance?"
                            helpActionLabel="Contact Concierge"
                            onHelp={() => navigation.getParent()?.navigate(STACK_ROUTES.ContactStack)}   // on top, so Back returns here
                        />
                    )}
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
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={p.accent.main}
                        colors={[p.primary.main]}
                    />
                }
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
                            {photoBusy && (
                                <View style={[styles.avatarBusy, { backgroundColor: withAlpha(p.primary.dark, 0.55) }]}>
                                    <ActivityIndicator color={p.accent.light} />
                                </View>
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
                            onChangeText={(t) => { setPhone(t); if (errors.phone) setErrors((e) => ({ ...e, phone: undefined })); }}
                            onBlur={() => setPhone((cur) => formatPhoneDisplay(cur, country))}
                            placeholder="e.g. +44 7700 900000"
                            keyboardType="phone-pad"
                            error={errors.phone}
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
                            onSelect={(c) => {
                                // Lock phone to international (+..) using the OLD country before switching,
                                // so a half-typed national number isn't re-read under the new country.
                                setPhone((cur) => formatPhoneDisplay(cur, country));
                                setCountry(c);
                                if (errors.country) setErrors((e) => ({ ...e, country: undefined }));
                            }}
                            error={errors.country}
                        />
                    </View>
                </View>

                <View style={styles.saveWrap}>
                    <Button title="Save Changes" rightIcon="check" disabled={!isDirty || saving} loading={saving} onPress={onSave} />
                </View>
            </KeyboardAwareScrollView>

            <OptionsModal
                visible={showPhotoOptions}
                icon="camera"
                title="Profile Photo"
                message="Choose a new photo from your gallery, or remove the current one."
                options={[
                    { label: 'Choose New Photo', variant: 'primary', onPress: choosePhoto },
                    { label: 'Remove Photo', variant: 'destructive', onPress: removePhoto },
                ]}
                onCancel={() => setShowPhotoOptions(false)}
            />

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
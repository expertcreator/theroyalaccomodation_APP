import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { typography, spacing } from '../../../theme';
import { COUNTRIES } from '../../../constants/countries';
import { formatPhoneDisplay, isValidPhone, toE164 } from '../../../utils/phone';
import { showToast } from '../../../utils/ToastNotifier';
import type { IUserProfile } from '../../../interfaces/user';
import Text from '../../../components/Text/Text';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Dropdown/Select';
import Button from '../../../components/Buttons/Button';
import { styles } from '../styles';

/** The fields the booking needs (same as the website's required ones; email comes from the login). */
export const detailsComplete = (profile: IUserProfile | null): boolean =>
    !!profile?.firstName?.trim() && !!profile?.lastName?.trim() && !!profile?.address?.country?.trim();

type Errors = { firstName?: string; lastName?: string; phone?: string; country?: string };

type Props = {
    onEditingChange: (editing: boolean) => void;  // Book Now waits while details are being edited
};

/**
 * "Your details" on the Payment screen — from My Profile, editable right here
 * so the guest never has to leave Payment. Saving updates My Profile too.
 */
const DetailsCard: React.FC<Props> = ({ onEditingChange }) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const { profile, updateProfile, refreshProfile } = useAuth();

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [errors, setErrors] = useState<Errors>({});

    // The form fields (filled from the profile when editing starts).
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [line1, setLine1] = useState('');
    const [line2, setLine2] = useState('');
    const [city, setCity] = useState('');
    const [county, setCounty] = useState('');
    const [postCode, setPostCode] = useState('');
    const [country, setCountry] = useState('United Kingdom');

    // Copy the profile into the form and open it.
    const startEditing = () => {
        const a = profile?.address;
        setFirstName(profile?.firstName ?? '');
        setLastName(profile?.lastName ?? '');
        setPhone(formatPhoneDisplay(profile?.phone ?? '', a?.country ?? 'United Kingdom'));
        setLine1(a?.line1 ?? '');
        setLine2(a?.line2 ?? '');
        setCity(a?.city ?? '');
        setCounty(a?.county ?? '');
        setPostCode(a?.postCode ?? '');
        setCountry(a?.country || 'United Kingdom');
        setErrors({});
        setEditing(true);
    };

    // Something required is missing → open the form straight away.
    useEffect(() => {
        if (profile && !detailsComplete(profile) && !editing) startEditing();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile]);

    // Tell the screen whether the form is open (Book Now waits until it's saved).
    useEffect(() => {
        onEditingChange(editing);
    }, [editing, onEditingChange]);

    const clearError = (key: keyof Errors) => setErrors((e) => ({ ...e, [key]: undefined }));

    // While the saved details are incomplete, mark each empty required field.
    const requiredHint = (value: string) => (!detailsComplete(profile) && !value.trim() ? 'Required' : undefined);

    // Same checks as My Profile.
    const onSave = async () => {
        const next: Errors = {};
        if (!firstName.trim()) next.firstName = 'Please enter your first name';
        if (!lastName.trim()) next.lastName = 'Please enter your last name';
        if (!country.trim()) next.country = 'Please choose your country';
        if (phone.trim() && !isValidPhone(phone, country)) next.phone = 'Please enter a valid phone number';
        setErrors(next);
        if (next.firstName || next.lastName || next.country || next.phone) return;

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
            setEditing(false);
            showToast('success', 'Your details have been saved');
        } catch {
            showToast('danger', 'Could not save your details. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Profile didn't load (e.g. offline) — try again.
    const onRetry = async () => {
        setRetrying(true);
        try {
            await refreshProfile();
        } catch {
            showToast('danger', "Still couldn't load your details. Check your connection.");
        } finally {
            setRetrying(false);
        }
    };

    // One "LABEL   value" line in the summary.
    const Row = ({ label, value }: { label: string; value: string }) => (
        <View style={styles.detailsRow}>
            <Text style={[typography.overline, styles.detailsLabel, { color: p.text.placeHolder }]}>{label}</Text>
            <Text style={[typography.bodySmall, { color: value ? p.text.primary : p.text.placeHolder, flex: 1 }]}>
                {value || 'Not added'}
            </Text>
        </View>
    );

    const address = profile
        ? [profile.address?.line1, profile.address?.line2, profile.address?.city, profile.address?.county, profile.address?.postCode]
            .filter(Boolean).join(', ')
        : '';

    return (
        <View style={[styles.card, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
            <View style={styles.couponHeader}>
                <Text style={[typography.overline, { color: p.accent.dark }]}>YOUR DETAILS</Text>
                {profile && !editing && (
                    <TouchableOpacity onPress={startEditing} hitSlop={8}>
                        <Text style={[typography.bodySmall, { color: p.accent.dark, textDecorationLine: 'underline' }]}>Edit</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Profile not loaded */}
            {!profile && (
                retrying ? (
                    <ActivityIndicator color={p.primary.main} />
                ) : (
                    <>
                        <Text style={[typography.bodySmall, { color: p.text.primary }]}>Couldn't load your details.</Text>
                        <Button title="Try Again" variant="outline" size="sm" onPress={onRetry} style={{ marginTop: spacing.md }} />
                    </>
                )
            )}

            {/* Summary */}
            {profile && !editing && (
                <View>
                    <Row label="NAME" value={`${profile.firstName} ${profile.lastName}`.trim()} />
                    <Row label="EMAIL" value={profile.email} />
                    <Row label="PHONE" value={formatPhoneDisplay(profile.phone ?? '', profile.address?.country)} />
                    <Row label="ADDRESS" value={address} />
                    <Row label="COUNTRY" value={profile.address?.country ?? ''} />
                </View>
            )}

            {/* Edit right here (same fields and checks as My Profile) */}
            {profile && editing && (
                <View style={styles.detailsFields}>
                    {!detailsComplete(profile) && (
                        <Text style={[typography.caption, { color: p.warning.main }]}>
                            Please complete the highlighted details to book.
                        </Text>
                    )}
                    <Input
                        label="FIRST NAME"
                        value={firstName}
                        onChangeText={(t) => { setFirstName(t); clearError('firstName'); }}
                        placeholder="e.g. Alexander"
                        error={errors.firstName ?? requiredHint(firstName)}
                    />
                    <Input
                        label="LAST NAME"
                        value={lastName}
                        onChangeText={(t) => { setLastName(t); clearError('lastName'); }}
                        placeholder="e.g. Windsor"
                        error={errors.lastName ?? requiredHint(lastName)}
                    />
                    <View>
                        <Input label="EMAIL ADDRESS" value={profile.email} onChangeText={() => { }} editable={false} style={{ color: p.text.placeHolder }} />
                        <Text style={[typography.caption, { color: p.text.placeHolder, marginTop: spacing.xs }]}>
                            Your email can't be changed — it's linked to your account and bookings.
                        </Text>
                    </View>
                    <Input
                        label="PHONE (OPTIONAL)"
                        value={phone}
                        onChangeText={(t) => { setPhone(t); clearError('phone'); }}
                        onBlur={() => setPhone((cur) => formatPhoneDisplay(cur, country))}
                        placeholder="e.g. +44 7700 900000"
                        keyboardType="phone-pad"
                        error={errors.phone}
                    />
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
                            // Keep a half-typed phone number in the OLD country's format before switching.
                            setPhone((cur) => formatPhoneDisplay(cur, country));
                            setCountry(c);
                            clearError('country');
                        }}
                        error={errors.country}
                    />

                    <View style={styles.detailsButtons}>
                        {/* Cancel only makes sense when the saved details are already complete */}
                        {detailsComplete(profile) && (
                            <View style={{ flex: 1 }}>
                                <Button title="Cancel" variant="outline" size="sm" onPress={() => setEditing(false)} />
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            <Button title="Save Details" size="sm" loading={saving} loadingTitle="Saving…" onPress={onSave} />
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

export default DetailsCard;

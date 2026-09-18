import React, { useState } from 'react';
import { View, Image, TouchableOpacity, BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { typography, spacing } from '../../theme';
import { pickAvatar } from '../../utils/photo';
import type { DrawerParamList } from '../../navigation/types';

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

type Nav = DrawerNavigationProp<DrawerParamList>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MyProfile: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const { theme } = useTheme();
    const { user, updateUser } = useAuth();
    const p = theme.palette;

    // Seed editable fields from the current user.
    const [name, setName] = useState(user?.name ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [avatarUri, setAvatarUri] = useState<string | undefined>(user?.avatarUri);
    const [errors, setErrors] = useState<{ name?: string }>({});
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const pendingAction = React.useRef<any>(null);

    const email = user?.email ?? '';

    // Dirty-tracking: Save only enables when something actually changed.
    const isDirty =
        name !== (user?.name ?? '') ||
        phone !== (user?.phone ?? '') ||
        avatarUri !== user?.avatarUri;

    // Initials for the fallback avatar (no photo).
    const initials = (name.trim() || email || '?')
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const onPickPhoto = async () => {
        const uri = await pickAvatar();
        if (uri) setAvatarUri(uri);
    };

    const onSave = async () => {
        if (!name.trim()) {
            setErrors({ name: 'Please enter your name' });
            return;
        }
        await updateUser({ name: name.trim(), phone: phone.trim(), avatarUri });
        showToast('success', 'Profile updated');
    };

    const stayOnScreen = () => setShowLeaveConfirm(false);

    const onBackPress = () => {
        if (isDirty) {
            setShowLeaveConfirm(true);   // block + ask
        } else {
            navigation.goBack();          // clean — just leave
        }
    };

    const resetToUser = () => {
        setName(user?.name ?? '');
        setPhone(user?.phone ?? '');
        setAvatarUri(user?.avatarUri);
        setErrors({});
    };

    const discardAndLeave = () => {
        setShowLeaveConfirm(false);
        resetToUser();            // ← throw away the edits
        navigation.goBack();
    };

    useFocusEffect(
        React.useCallback(() => {
            // Re-seed the form from the latest user each time the screen is focused.
            setName(user?.name ?? '');
            setPhone(user?.phone ?? '');
            setAvatarUri(user?.avatarUri);
            setErrors({});
        }, [user])
    );

    useFocusEffect(
        React.useCallback(() => {
            const onHardwareBack = () => {
                if (isDirty) {
                    setShowLeaveConfirm(true);
                    return true;   // block default back
                }
                return false;      // allow default (leave)
            };
            const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
            return () => sub.remove();
        }, [isDirty])
    );

    return (
        <View style={[styles.container, { backgroundColor: p.background.default }]}>
            <Header title="My Profile" onBack={onBackPress} />

            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                bottomOffset={spacing.xl}
            >
                {/* Avatar + name + email */}
                <View style={styles.hero}>
                    <TouchableOpacity activeOpacity={0.85} onPress={onPickPhoto} style={styles.avatarWrap}>
                        <View style={[styles.avatar, { backgroundColor: p.primary.main, borderColor: p.accent.main }]}>
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatarImage} resizeMode="cover" />
                            ) : (
                                <Text style={{ color: p.accent.light, fontSize: 22, letterSpacing: 2 }}>{initials}</Text>
                            )}
                        </View>
                        <View style={[styles.cameraBadge, { backgroundColor: p.accent.main, borderColor: p.background.default }]}>
                            <Icon name="camera" size={13} color={p.primary.main} />
                        </View>
                    </TouchableOpacity>

                    <Text style={[typography.title, styles.name, { color: p.primary.main }]}>
                        {name.trim() || 'Your Name'}
                    </Text>
                    <Text style={[typography.caption, styles.email, { color: p.text.placeHolder }]}>
                        {email}
                    </Text>
                </View>

                <DiamondDivider />

                {/* Account details */}
                <View style={{ marginTop: spacing.lg }}>
                    <SectionEyebrow label="Account Details" />

                    <View style={styles.fields}>
                        <Input
                            label="FULL NAME"
                            value={name}
                            onChangeText={(t) => { setName(t); if (errors.name) setErrors({}); }}
                            placeholder="e.g. Alexander Windsor"
                            error={errors.name}
                        />

                        {/* Email is read-only (account identity — changing it needs re-verification later) */}
                        <Input
                            label="EMAIL ADDRESS"
                            value={email}
                            onChangeText={() => { }}
                            editable={false}
                            selectTextOnFocus={false}
                            style={{ color: p.text.placeHolder }}
                        />

                        <Input
                            label="PHONE"
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="e.g. +44 7700 900000"
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                <View style={styles.saveWrap}>
                    <Button title="Save Changes" rightIcon="check" disabled={!isDirty} onPress={onSave} />
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
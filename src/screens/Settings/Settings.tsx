import React, { useState } from 'react';
import { View, ScrollView, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { typography, spacing } from '../../theme';
import type { DrawerParamList, RootStackParamList } from '../../navigation/types';
import { DRAWER_ROUTES, STACK_ROUTES } from '../../navigation/routes';

import Text from '../../components/Text/Text';
import Header from '../../components/Headers/Header';
import Button from '../../components/Buttons/Button';
import Icon from '../../components/Icon/Icon';
import SectionEyebrow from '../../components/SectionEyebrow/SectionEyebrow';
import ConfirmModal from '../../components/Modals/ConfirmModal';
import { styles } from './styles';
import { showToast } from '../../utils/ToastNotifier';
import { authErrorMessage } from '../../firebase/authErrors';
import PasswordPromptModal from '../../components/Modals/PasswordPromptModal';

type Nav = DrawerNavigationProp<DrawerParamList>;

const Settings: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const { theme, isDarkMode, toggleTheme } = useTheme();
    const { isLoggedIn, signOut, deleteAccount } = useAuth();
    const p = theme.palette;

    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | undefined>(undefined);

    const onSignOut = async () => {
        setShowSignOutConfirm(false);
        await signOut();                       // AuthContext clears everything
        navigation.navigate(DRAWER_ROUTES.Home);
    };

    const goToSignIn = () =>
        navigation
            .getParent<NativeStackNavigationProp<RootStackParamList>>()
            ?.navigate(STACK_ROUTES.LoginRegister, { entry: 'drawer' });

    const onConfirmDelete = async (password: string) => {
        try {
            setDeleting(true);
            setDeleteError(undefined);
            await deleteAccount(password);            // reauth → delete profile → delete auth user
            setShowDeleteConfirm(false);
            showToast('success', 'Your account has been deleted.');
            navigation.navigate(DRAWER_ROUTES.Home);  // onAuthStateChanged already cleared state
        } catch (e) {
            setDeleteError(authErrorMessage(e));       // wrong password, network, etc.
        } finally {
            setDeleting(false);
        }
    };

    const closeDeleteModal = () => {
        setShowDeleteConfirm(false);
        setDeleteError(undefined);
    };

    return (
        <View style={[styles.container, { backgroundColor: p.background.default }]}>
            <Header title="Settings" onBack={() => navigation.goBack()} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Preferences */}
                <SectionEyebrow label="Preferences" />
                <View style={[styles.card, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <Icon name="moon" size={18} color={p.accent.main} />
                            <View>
                                <Text style={[typography.label, { color: p.text.primary }]}>Dark Mode</Text>
                                <Text style={[typography.caption, { color: p.text.placeHolder, marginTop: spacing.xxs }]}>
                                    Switch appearance
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                            trackColor={{ false: p.borderColor, true: p.primary.main }}
                            thumbColor={isDarkMode ? p.accent.light : '#FFFFFF'}
                            ios_backgroundColor={p.borderColor}
                        />
                    </View>
                </View>

                {/* Account */}
                <View style={{ marginTop: spacing.xl }}>
                    <SectionEyebrow label="Account" />
                    <View style={{ marginTop: spacing.md, rowGap: spacing.md }}>
                        {isLoggedIn ? (
                            <>
                                <Button title="Sign Out" variant="outline" rightIcon="log-out" onPress={() => setShowSignOutConfirm(true)} />
                                <Button title="Delete My Account" variant="destructive" rightIcon="trash" onPress={() => setShowDeleteConfirm(true)} />
                                <Text style={[typography.caption, { color: p.text.placeHolder, textAlign: 'center' }]}>
                                    Deleting your account permanently removes your profile. Your bookings remain with the property.
                                </Text>
                            </>
                        ) : (
                            <Button title="Sign In" rightIcon="arrow-right" onPress={goToSignIn} />
                        )}
                    </View>
                </View>
            </ScrollView>

            <ConfirmModal
                visible={showSignOutConfirm}
                title="Sign Out?"
                message="You can sign back in anytime to manage your bookings."
                cancelBtnText="Cancel"
                confirmBtnText="Sign Out"
                onCancel={() => setShowSignOutConfirm(false)}
                onConfirm={onSignOut}
            />

            <PasswordPromptModal
                visible={showDeleteConfirm}
                title="Delete Account?"
                message="This permanently deletes your account and profile and can't be undone. Enter your password to confirm. Your bookings remain with the property."
                confirmBtnText="Delete"
                cancelBtnText="Cancel"
                destructive
                loading={deleting}
                error={deleteError}
                onCancel={closeDeleteModal}
                onConfirm={onConfirmDelete}
            />
        </View>
    );
};

export default Settings;
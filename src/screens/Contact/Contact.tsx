import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Linking } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';

import { useTheme } from '../../context/ThemeContext';
import { typography, spacing } from '../../theme';
import { withAlpha } from '../../utils/color';
import { CONTACT } from '../../constants/data';
import imagePath from '../../constants/imagePath';
import type { DrawerParamList } from '../../navigation/types';

import Text from '../../components/Text/Text';
import Header from '../../components/Headers/Header';
import DiamondDivider from '../../components/Dividers/DiamondDivider';
import Button from '../../components/Buttons/Button';
import Select from '../../components/Dropdown/Select';
import ContactRow from './components/ContactRow';
import { styles } from './styles';
import Input from '../../components/Input/Input';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { showToast } from '../../utils/ToastNotifier';
import { sendEnquiryAPI } from '../../api/raApi';
import { isValidEmail } from '../../utils/validation';
import { formatPhoneDisplay } from '../../utils/phone';

type Nav = DrawerNavigationProp<DrawerParamList>;

const PROPERTY_OPTIONS = ['Not specified', 'Luxury Ascot Mansion', 'Royal Windsor Stately Home'];

interface IFormErrors {
    name?: string;
    email?: string;
    message?: string
}

const Contact: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const { theme } = useTheme();
    const p = theme.palette;

    // Form state — one object keeps it tidy.
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [property, setProperty] = useState(PROPERTY_OPTIONS[0]);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState<IFormErrors>({});
    const [submitting, setSubmitting] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            // Clear the form whenever the screen loses focus
            // (back button, hardware back, drawer switch, swipe — all covered).
            return () => resetForm();
        }, [])
    );

    const submitEnquiry = async () => {
        const nextErrors: { name?: string; email?: string; message?: string } = {};
        if (!name.trim()) nextErrors.name = 'Please enter your name';
        if (!email.trim()) nextErrors.email = 'Please enter your email address';
        else if (!isValidEmail(email)) nextErrors.email = 'Please enter a valid email';
        if (!message.trim()) nextErrors.message = 'Please enter a message';

        setErrors(nextErrors);
        if (nextErrors.name || nextErrors.email || nextErrors.message) return;

        try {
            setSubmitting(true);
            const res = await sendEnquiryAPI({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                property,
                message: message.trim(),
            });

            if (res?.success) {
                showToast('success', "Enquiry received — we'll be in touch");
                resetForm();
            } else if (res) {
                // non-2xx: server told us why (e.g. rate limited, bad input)
                showToast('warning', res.message || 'Could not send your enquiry.');
            }
            // res === null → network error, already toasted by apiClient
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setName('');
        setPhone('');
        setEmail('');
        setProperty(PROPERTY_OPTIONS[0]);
        setMessage('');
        setErrors({});
    };

    const onBackPress = () => {
        navigation.goBack();
    }

    const openMaps = (url: string) => Linking.openURL(url).catch(() => { });

    return (
        <View style={[styles.container, { backgroundColor: p.background.default }]}>
            <Header title="Contact" onBack={() => onBackPress()} />

            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                bottomOffset={spacing.xl}
            >
                {/* Intro */}
                <View style={styles.intro}>
                    <DiamondDivider />
                    <Text style={[typography.body, styles.introText, { color: p.text.placeHolder }]}>
                        We're here to help with your booking or any questions.
                    </Text>
                </View>

                {/* Map card — tap to open maps */}
                <TouchableOpacity activeOpacity={0.9} onPress={() => openMaps(CONTACT.mapsUrl[0])} style={[styles.mapCard, { borderColor: p.borderColor }]}>
                    <Image source={imagePath.map} style={styles.mapImage} resizeMode="cover" />
                    <View style={[styles.mapTag, { backgroundColor: withAlpha(p.background.card, 0.95), borderColor: p.borderColor }]}>
                        <View style={[styles.mapTagDot, { backgroundColor: p.accent.main }]} />
                        <Text style={[typography.overline, { color: p.text.primary }]}>WINDSOR & ASCOT ESTATES</Text>
                    </View>
                </TouchableOpacity>

                {/* Get in touch */}
                <Text style={[typography.overline, { color: p.text.primary, marginBottom: spacing.sm }]}>GET IN TOUCH</Text>
                <View style={[styles.contactCard, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
                    <ContactRow icon="mail" label="EMAIL US" onPress={() => Linking.openURL(`mailto:${CONTACT.email}`)}>
                        <Text style={[typography.bodySmall, { color: p.text.primary }]}>{CONTACT.email}</Text>
                    </ContactRow>

                    <View style={[styles.rowDivider, { backgroundColor: p.divider }]} />

                    <ContactRow icon="phone" label="PHONE">
                        <TouchableOpacity onPress={() => Linking.openURL(`tel:${CONTACT.phone}`)}>
                            <Text style={[typography.bodySmall, { color: p.text.primary }]}>{CONTACT.phoneDisplay}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => Linking.openURL(`tel:${CONTACT.phone2}`)}>
                            <Text style={[typography.bodySmall, { color: p.text.primary, marginTop: spacing.xxs }]}>{CONTACT.phone2Display}</Text>
                        </TouchableOpacity>
                    </ContactRow>

                    <View style={[styles.rowDivider, { backgroundColor: p.divider }]} />

                    <ContactRow icon="map-pin" label="ADDRESS" onPress={() => openMaps(CONTACT.mapsUrl[1])}>
                        {CONTACT.address.map((line, i) => (
                            <Text key={i} style={[typography.bodySmall, { color: p.text.primary }]}>{line}</Text>
                        ))}
                    </ContactRow>
                </View>

                {/* Enquiry form */}
                <View style={[styles.formCard, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
                    <View style={[styles.formHeader, { borderBottomColor: p.divider }]}>
                        <Text style={[typography.overline, { color: p.text.primary }]}>SEND AN ENQUIRY</Text>
                        <Text style={[typography.caption, { color: p.text.placeHolder, marginTop: spacing.xxs }]}>
                            We'll get back to you as soon as possible.
                        </Text>
                    </View>

                    <View style={styles.formFields}>
                        <Input
                            label="YOUR FULL NAME"
                            value={name}
                            onChangeText={(text) => { setName(text); if (errors.name) setErrors((e) => ({ ...e, name: undefined })); }}
                            placeholder="e.g. Alexander Wright"
                            error={errors.name}
                        />
                        <Input
                            label="TELEPHONE NUMBER"
                            value={phone}
                            onChangeText={setPhone}
                            onBlur={() => setPhone((cur) => formatPhoneDisplay(cur, 'United Kingdom'))}
                            placeholder="+44 7000 000000"
                            keyboardType="phone-pad"
                        />
                        <Input
                            label="EMAIL ADDRESS"
                            value={email}
                            onChangeText={(text) => { setEmail(text); if (errors.email) setErrors((e) => ({ ...e, email: undefined })); }}
                            placeholder="name@domain.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={errors.email}
                        />
                        <Select label="INTERESTED PROPERTY" value={property} options={PROPERTY_OPTIONS} onSelect={setProperty} />
                        <Input
                            label="MESSAGE / REQUIREMENTS"
                            value={message}
                            onChangeText={(t) => { setMessage(t); if (errors.message) setErrors((e) => ({ ...e, message: undefined })); }}
                            placeholder="Your dates, questions or any special requests..."
                            error={errors.message}
                            multiline
                        />

                        <View style={{ marginTop: spacing.sm }}>
                            <Button title="Send Enquiry" rightIcon="arrow-right" onPress={submitEnquiry} loading={submitting} />
                        </View>
                    </View>

                    <Text style={[typography.caption, styles.privacyNote, { color: p.text.placeHolder }]}>
                        Your details are kept private.
                    </Text>
                </View>
            </KeyboardAwareScrollView>

        </View>
    );
};

export default Contact;
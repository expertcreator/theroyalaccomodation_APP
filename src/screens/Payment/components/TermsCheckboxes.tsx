import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { typography } from '../../../theme';
import Text from '../../../components/Text/Text';
import Icon from '../../../components/Icon/Icon';
import { styles } from '../styles';

type Props = {
    acceptTerms: boolean;
    acceptPrivacy: boolean;
    onToggleTerms: () => void;
    onTogglePrivacy: () => void;
    onOpenTerms: () => void;     // NEW
    onOpenPrivacy: () => void;   // NEW
};

const TermsCheckboxes: React.FC<Props> = ({
    acceptTerms, acceptPrivacy, onToggleTerms, onTogglePrivacy, onOpenTerms, onOpenPrivacy,
}) => {
    const { theme } = useTheme();
    const p = theme.palette;

    const Box = ({ checked }: { checked: boolean }) => (
        <View style={[styles.checkbox, { borderColor: p.borderColor, backgroundColor: checked ? p.primary.main : 'transparent' }]}>
            {checked && <Icon name="check" size={12} color={p.primary.contrastText} />}
        </View>
    );

    const Link = ({ label, onPress }: { label: string; onPress: () => void }) => (
        <Text
            onPress={onPress}
            style={[typography.caption, { color: p.accent.dark, textDecorationLine: 'underline' }]}
        >
            {label}
        </Text>
    );

    return (
        <View style={styles.terms}>
            <TouchableOpacity style={styles.termRow} activeOpacity={0.7} onPress={onToggleTerms}>
                <Box checked={acceptTerms} />
                <Text style={[typography.caption, { color: p.text.primary, flex: 1 }]}>
                    I accept the <Link label="Terms & Conditions" onPress={onOpenTerms} /> for private estate hire and patron guidelines.
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.termRow} activeOpacity={0.7} onPress={onTogglePrivacy}>
                <Box checked={acceptPrivacy} />
                <Text style={[typography.caption, { color: p.text.primary, flex: 1 }]}>
                    I agree to the <Link label="Privacy Policy" onPress={onOpenPrivacy} /> and secure, discreet handling of patron records.
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default TermsCheckboxes;
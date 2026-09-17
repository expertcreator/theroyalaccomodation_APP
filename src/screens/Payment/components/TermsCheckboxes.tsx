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
};

const TermsCheckboxes: React.FC<Props> = ({ acceptTerms, acceptPrivacy, onToggleTerms, onTogglePrivacy }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    // One row = a checkbox + its label. Kept local since it's only used here.
    const Row = ({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: React.ReactNode }) => (
        <TouchableOpacity style={styles.termRow} activeOpacity={0.7} onPress={onToggle}>
            <View style={[styles.checkbox, { borderColor: p.borderColor, backgroundColor: checked ? p.primary.main : 'transparent' }]}>
                {checked && <Icon name="check" size={12} color={p.primary.contrastText} />}
            </View>
            <Text style={[typography.caption, { color: p.text.primary, flex: 1 }]}>{children}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.terms}>
            <Row checked={acceptTerms} onToggle={onToggleTerms}>
                I accept the Terms & Conditions for private estate hire and patron guidelines.
            </Row>
            <Row checked={acceptPrivacy} onToggle={onTogglePrivacy}>
                I agree to the Privacy Policy and secure, discreet handling of patron records.
            </Row>
        </View>
    );
};

export default TermsCheckboxes;
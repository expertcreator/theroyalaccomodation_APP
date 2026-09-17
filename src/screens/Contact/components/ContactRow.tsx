import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing } from '../../../theme';
import Text from '../../../components/Text/Text';
import Icon, { IconName } from '../../../components/Icon/Icon';
import { styles } from '../styles';

type Props = {
    icon: IconName;
    label: string;            // "EMAIL US"
    children: React.ReactNode; // the value(s) below the label
    onPress?: () => void;     // makes the whole row tappable (email/address)
};

const ContactRow: React.FC<Props> = ({ icon, label, children, onPress }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    // Tappable rows use TouchableOpacity; static rows (phone has its own links) use View.
    const Wrapper: any = onPress ? TouchableOpacity : View;

    return (
        <Wrapper style={styles.contactRow} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.contactIcon, { backgroundColor: p.background.default, borderColor: p.borderColor }]}>
                <Icon name={icon} size={16} color={p.accent.main} />
            </View>
            <View style={styles.contactText}>
                <Text style={[typography.overline, { color: p.text.placeHolder }]}>{label}</Text>
                {children}
            </View>
            {onPress && <Icon name="external-link" size={14} color={p.accent.main} />}
        </Wrapper>
    );
};

export default ContactRow;
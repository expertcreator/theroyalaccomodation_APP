import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing } from '../../../theme';
import Text from '../../../components/Text/Text';
import SectionHeader from '../../../components/Headers/SectionHeader';
import type { Property } from '../../../interfaces/property';

type Props = { property: Property };

const Narrative: React.FC<Props> = ({ property }) => {
    const { theme } = useTheme();
    const p = theme.palette;
    return (
        <View>
            <SectionHeader title="ESTATE NARRATIVE" />
            <Text style={[typography.bodySmall, { color: p.text.primary, marginTop: spacing.sm, textAlign: 'justify' }]}>
                {property.narrative}
            </Text>
        </View>
    );
};

export default Narrative;
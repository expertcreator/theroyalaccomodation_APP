import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { typography } from '../../../theme';
import { formatGBP } from '../../../utils/format';
import Text from '../../../components/Text/Text';
import Button from '../../../components/Buttons/Button';
import FooterBar from '../../../components/Footer/FooterBar';
import type { Property } from '../../../interfaces/property';

type Props = { property: Property; onCheck: () => void };

const BottomBar: React.FC<Props> = ({ property, onCheck }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    return (
        <FooterBar
            left={
                <>
                    <Text style={[typography.overline, { color: p.text.placeHolder }]}>FROM</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={[typography.h2, { color: p.text.primary }]}>{formatGBP(property.baseRate)}</Text>
                        <Text style={[typography.caption, { color: p.text.placeHolder }]}> / night</Text>
                    </View>
                </>
            }
            right={<Button title="Check Availability" size="sm" rightIcon="arrow-right" fullWidth={false} onPress={onCheck} />}
        />
    );
};

export default BottomBar;
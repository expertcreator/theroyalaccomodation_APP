import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { typography } from '../../../theme';
import { formatGBP } from '../../../utils/format';
import Text from '../../../components/Text/Text';
import Button from '../../../components/Buttons/Button';
import FooterBar from '../../../components/Footer/FooterBar';

type Props = { total: number; nights: number; rangeComplete: boolean; onProceed: () => void };

const BottomBar: React.FC<Props> = ({ total, nights, rangeComplete, onProceed }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    return (
        <FooterBar
            left={
                <>
                    <Text style={[typography.overline, { color: p.text.placeHolder }]}>RESIDENCE TOTAL</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={[typography.h2, { color: p.primary.main }]}>{rangeComplete ? formatGBP(total) : '£—'}</Text>
                        <Text style={[typography.caption, { color: p.text.placeHolder }]}> / {nights} nights</Text>
                    </View>
                </>
            }
            right={<Button title="Proceed" size="sm" rightIcon="arrow-right" fullWidth={false} disabled={!rangeComplete} onPress={onProceed} />}
        />
    );
};

export default BottomBar;
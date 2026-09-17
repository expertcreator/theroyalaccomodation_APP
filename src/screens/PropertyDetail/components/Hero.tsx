import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderWidth } from '../../../theme';
import { withAlpha } from '../../../utils/color';
import Text from '../../../components/Text/Text';
import Button from '../../../components/Buttons/Button';
import type { Property } from '../../../interfaces/property';
import { styles } from '../styles';

type Props = { property: Property; onBook: () => void };

const Hero: React.FC<Props> = ({ property, onBook }) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const goldOutline = { borderWidth: borderWidth.thin, borderColor: withAlpha(p.accent.main, 0.5) };

    return (
        <View style={[styles.hero, { backgroundColor: p.primary.dark }]}>
            <Image source={property.image} style={styles.heroImage} resizeMode="cover" />
            <LinearGradient
                colors={['rgba(8,41,0,0.55)', 'transparent', withAlpha(p.primary.dark, 0.95)]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />

            <View style={styles.heroContent}>
                {/* Badge */}
                <View style={[styles.badge, { borderColor: withAlpha(p.accent.main, 0.4) }]}>
                    <View style={[styles.badgeDot, { backgroundColor: p.accent.main }]} />
                    <Text style={[typography.overline, { color: p.accent.light }]} numberOfLines={1}>
                        {property.tag} · {property.location.toUpperCase()}
                    </Text>
                </View>

                {/* Title + tagline */}
                <Text style={[typography.h1, { color: '#FFFFFF', marginTop: spacing.md }]}>{property.name}</Text>
                <Text style={[typography.overline, { color: withAlpha(p.accent.light, 0.9), marginTop: spacing.xs }]}>
                    {property.tagline}
                </Text>

                {/* Book now */}
                <View style={styles.heroButton}>
                    <Button title="Book Now" rightIcon="arrow-right" size="sm" fullWidth={false} onPress={onBook} style={goldOutline} />
                </View>
            </View>
        </View>
    );
};

export default Hero;
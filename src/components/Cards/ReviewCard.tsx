import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radius, borderWidth } from '../../theme';
import { withAlpha } from '../../utils/color';
import Text from '../Text/Text';
import Stars from '../Stars/Stars';

// Reusable, prop-driven review card — pass the fields, not a data object.
type Props = {
    reviewer: string;
    rating: number;
    text: string;
    headline?: string;
    date?: string;     // e.g. 'July 2025'
    agency?: string;   // e.g. 'Airbnb'
};

const CLAMP_LINES = 4;

const ReviewCard: React.FC<Props> = ({ reviewer, rating, text, headline, date, agency }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    // Measure once (unclamped) to decide whether "Read more" is needed, then clamp.
    const [measured, setMeasured] = useState(false);
    const [needClamp, setNeedClamp] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const initial = (reviewer?.trim()?.[0] ?? '?').toUpperCase();

    return (
        <View style={[styles.card, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
            {/* gold spine — marks a quoted voice */}
            <View style={[styles.spine, { backgroundColor: p.accent.main }]} />

            <View style={styles.pad}>
                <View style={styles.top}>
                    <View style={styles.who}>
                        <View style={[styles.avatar, { backgroundColor: p.primary.main, borderColor: withAlpha(p.accent.main, 0.35) }]}>
                            <Text style={[typography.subtitle, { color: p.primary.contrastText }]}>{initial}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[typography.label, { color: p.text.primary }]} numberOfLines={1}>
                                {reviewer}
                            </Text>
                            {!!date && (
                                <Text style={[typography.caption, { color: p.text.placeHolder }]} numberOfLines={1}>
                                    Stayed {date}
                                </Text>
                            )}
                        </View>
                    </View>
                    <Stars rating={rating} size={moderateScale(13)} />
                </View>

                {!!headline && (
                    <Text style={[typography.title, { color: p.text.primary, marginTop: spacing.sm }]}>
                        {headline}
                    </Text>
                )}

                <Text
                    style={[typography.bodySmall, { color: p.text.primary, marginTop: spacing.xxs }]}
                    numberOfLines={!measured ? undefined : expanded ? undefined : CLAMP_LINES}
                    onTextLayout={(e) => {
                        if (!measured) {
                            setNeedClamp(e.nativeEvent.lines.length > CLAMP_LINES);
                            setMeasured(true);
                        }
                    }}
                >
                    {text}
                </Text>

                {needClamp && (
                    <TouchableOpacity onPress={() => setExpanded((v) => !v)} activeOpacity={0.7} style={{ marginTop: spacing.xs }}>
                        <Text style={[typography.caption, { color: p.accent.main, fontWeight: '600' }]}>
                            {expanded ? 'Show less' : 'Read more'}
                        </Text>
                    </TouchableOpacity>
                )}

                {!!agency && (
                    <View style={styles.src}>
                        <View style={[styles.dot, { backgroundColor: p.accent.main }]} />
                        <Text style={[typography.overline, { color: p.text.placeHolder }]}>via {agency}</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: { borderWidth: borderWidth.thin, borderRadius: radius.lg, overflow: 'hidden' },
    spine: { position: 'absolute', left: 0, top: spacing.md, bottom: spacing.md, width: moderateScale(3), borderRadius: moderateScale(3) },
    pad: { padding: spacing.md, paddingLeft: spacing.md + spacing.sm },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: spacing.sm },
    who: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.sm, flex: 1, minWidth: 0 },
    avatar: {
        width: moderateScale(36), height: moderateScale(36), borderRadius: moderateScale(18),
        alignItems: 'center', justifyContent: 'center', borderWidth: borderWidth.thin,
    },
    src: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.xs, marginTop: spacing.sm },
    dot: { width: moderateScale(4), height: moderateScale(4), borderRadius: moderateScale(2) },
});

export default ReviewCard;
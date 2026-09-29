import React from 'react';
import { View, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing } from '../../../theme';
import Text from '../../../components/Text/Text';
import SectionHeader from '../../../components/Headers/SectionHeader';
import Stars from '../../../components/Stars/Stars';
import { useResidenceReviews } from '../../../context/ReviewContext';
import ReviewCard from '../../../components/Cards/ReviewCard';

// Pass the accom id, not the whole property.
type Props = { accomId: number };

const ReviewsSection: React.FC<Props> = ({ accomId }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    const data = useResidenceReviews(accomId);

    // Hide the section entirely when there are no reviews (or nothing loaded).
    if (!data || data.count === 0) return null;

    return (
        <View>
            <SectionHeader title="GUEST REVIEWS" rightText="VERIFIED STAYS" />

            {/* Summary: average + stars + count */}
            <View style={styles.summary}>
                <Text style={[typography.h2, { color: p.text.primary }]}>{data.average.toFixed(1)}</Text>
                <View>
                    <Stars rating={data.average} size={moderateScale(16)} />
                    <Text style={[typography.caption, { color: p.text.placeHolder, marginTop: spacing.xxs }]}>
                        {data.count} {data.count === 1 ? 'review' : 'reviews'}
                    </Text>
                </View>
            </View>

            {/* List — same ReviewCard for every review */}
            <View style={{ rowGap: spacing.sm }}>
                {data.reviews.map((r, i) => (
                    <ReviewCard
                        key={i}
                        reviewer={r.reviewer}
                        rating={r.rating}
                        text={r.text}
                        headline={r.headline}
                        date={r.date}
                        agency={r.agency}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    summary: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: spacing.lg,
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
});

export default ReviewsSection;
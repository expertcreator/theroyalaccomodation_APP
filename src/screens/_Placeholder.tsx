import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';

export default function PlaceholderScreen() {
    const route = useRoute();
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{route.name}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 18 },
});
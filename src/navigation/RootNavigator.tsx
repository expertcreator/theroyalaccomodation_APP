import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import DrawerNavigator from './DrawerNavigator';
import PlaceholderScreen from '../screens/_Placeholder';
import { STACK_ROUTES } from './routes';
import { useTheme } from '../context/ThemeContext';
import CustomStatusBar from '@sominaththore/react-native-custom-status-bar';
import PropertyDetail from '../screens/PropertyDetail/PropertyDetail';
import CheckAvailability from '../screens/CheckAvailability/CheckAvailability';
import LoginRegister from '../screens/LoginRegister/LoginRegister';
import Payment from '../screens/Payment/Payment';
import BookingConfirmed from '../screens/BookingConfirmed/BookingConfirmed';
import { useEffect } from 'react';
import { hideSplash } from 'react-native-splash-view';
import { useRates } from '../context/RatesContext';
import { useAuth } from '../context/AuthContext';
import ForgotPassword from '../screens/ForgotPassword/ForgotPassword';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const { theme, isDarkMode } = useTheme();
    const bg = theme.palette.background.default; // cream in light mode

    // Hold the native splash until BOTH are settled:
    //  - rates: the rates API has given a definitive answer (success or fail)
    //  - auth:  Firebase has restored any saved session, so the drawer shows
    //           the right state (signed-in name vs "Sign in") on first paint.
    const { ready } = useRates();
    const { initializing } = useAuth();
    useEffect(() => {
        if (ready && !initializing) {
            hideSplash();
        }
    }, [ready, initializing]);

    return (
        <>
            <CustomStatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={bg}
            />

            <Stack.Navigator initialRouteName={STACK_ROUTES.DrawerRoot}>
                <Stack.Screen name={STACK_ROUTES.DrawerRoot} component={DrawerNavigator} options={{ headerShown: false }} />
                <Stack.Screen name={STACK_ROUTES.PropertyDetail} component={PropertyDetail} options={{ headerShown: false }} />
                <Stack.Screen name={STACK_ROUTES.CheckAvailability} component={CheckAvailability} options={{ headerShown: false }} />
                <Stack.Screen name={STACK_ROUTES.SearchResults} component={PlaceholderScreen} options={{ headerShown: false }} />
                <Stack.Screen name={STACK_ROUTES.LoginRegister} component={LoginRegister} options={{ headerShown: false }} />
                <Stack.Screen name={STACK_ROUTES.PaymentReview} component={Payment} options={{ headerShown: false }} />
                <Stack.Screen name={STACK_ROUTES.BookingConfirmed} component={BookingConfirmed} options={{ headerShown: false }} />
                <Stack.Screen name={STACK_ROUTES.ForgotPassword} component={ForgotPassword} options={{ headerShown: false }} />
            </Stack.Navigator>
        </>
    );
}
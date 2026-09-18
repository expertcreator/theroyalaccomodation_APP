import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ToastProvider } from 'react-native-toast-notifications';
import { STRIPE_PUBLISHABLE_KEY } from './src/constants/stripe';
import { StripeProvider } from '@stripe/stripe-react-native';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
                  <NavigationContainer>
                    <RootNavigator />
                  </NavigationContainer>
                </StripeProvider>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
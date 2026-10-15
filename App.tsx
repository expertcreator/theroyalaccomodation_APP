import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ToastProvider } from 'react-native-toast-notifications';
import { RatesProvider } from './src/context/RatesContext';
import { ReviewsProvider } from './src/context/ReviewContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                {/* Stripe is started on the Payment screen, with the key our plugin
                    gives it (useCheckoutConfig) — no Stripe key lives in the app. */}
                <RatesProvider>
                  <ReviewsProvider>
                    <NavigationContainer>
                      <RootNavigator />
                    </NavigationContainer>
                  </ReviewsProvider>
                </RatesProvider>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import routes from './src/navigation/routes';
import Home from './src/screens/Home/Home';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name={routes.Home} component={Home} />
        </Stack.Navigator>

      </NavigationContainer>
    </SafeAreaProvider>
  );
}
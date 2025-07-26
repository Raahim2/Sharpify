// App.js
import 'react-native-gesture-handler';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import HomeScreen from './screens/HomeScreen';
import EditScreen from './screens/EditScreen';
import TokenScreen from './screens/TokenScreen';
import FeatureTestScreen from './screens/FeatureTestScreen';
import RecolorScreen from './screens/RecolorScreen'; 
import Test from './screens/Test'


const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}>
            <Stack.Screen name="Test" component={Test} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Token" component={TokenScreen} />
            <Stack.Screen name="FeatureTest" component={FeatureTestScreen} />
            <Stack.Screen name="Edit" component={EditScreen} />
            <Stack.Screen name="Recolor" component={RecolorScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </GestureHandlerRootView>
  );
};

export default App;

// npx expo install @tensorflow/tfjs @tensorflow/tfjs-react-native expo-gl expo-asset
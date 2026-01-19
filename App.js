import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import CareRecipientHome from './src/screens/CareRecipientHome';
import CaregiverHome from './src/screens/CaregiverHome';
import CareRecipientDetail from './src/screens/CareRecipientDetail';
import RecordingDetail from './src/screens/RecordingDetail';
import RecipientProfile from './src/screens/RecipientProfile';
import CaregiverGroupChat from './src/screens/CaregiverGroupChat';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          options={{ headerShown: false }}
        >
          {props => <LoginScreen {...props} setUser={setUser} />}
        </Stack.Screen>
        <Stack.Screen
          name="CareRecipientHome"
          component={CareRecipientHome}
          options={{ title: 'Record Message', headerLeft: () => null }}
        />
        <Stack.Screen
          name="CaregiverHome"
          component={CaregiverHome}
          options={{ title: 'Care Recipients', headerLeft: () => null }}
        />
        <Stack.Screen
          name="CareRecipientDetail"
          component={CareRecipientDetail}
          options={{ title: 'Care Recipient Details' }}
        />
        <Stack.Screen
          name="RecipientProfile"
          component={RecipientProfile}
          options={{ title: 'Care Profile' }}
        />
        <Stack.Screen
          name="RecordingDetail"
          component={RecordingDetail}
          options={{ title: 'Recording & Notes' }}
        />
        <Stack.Screen
          name="CaregiverGroupChat"
          component={CaregiverGroupChat}
          options={{ title: 'Care Team Chat' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
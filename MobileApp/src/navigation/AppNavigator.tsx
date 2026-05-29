import React from 'react';

import { NavigationContainer } from '@react-navigation/native';

import { createStackNavigator } from '@react-navigation/stack';

import FormScreen from '../screens/FormScreen';
import ResultScreen from '../screens/ResultScreen';
import MapScreen from '../screens/MapScreen';

export type RootStackParamList = {
  Form: undefined;

  Result: {
    complaint: string;
    triageResult: any;
  };

  Map: {
    triageColor: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Form"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#13131A',
          },
          headerTintColor: '#FFF',
        }}
      >
        <Stack.Screen
          name="Form"
          component={FormScreen}
          options={{
            title: 'AI Triage System',
          }}
        />

        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{
            title: 'Analiz Sonucu',
          }}
        />

        <Stack.Screen
          name="Map"
          component={MapScreen}
          options={{
            title: 'Yakındaki Hastaneler',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type SplashScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Splash'
>;

interface Props {
  navigation: SplashScreenNavigationProp;
}

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Form');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🩺</Text>

      <Text style={styles.title}>AI TRIAGE SYSTEM</Text>

      <Text style={styles.subtitle}>
        Yapay Zeka Destekli Acil Önceliklendirme
      </Text>

      <ActivityIndicator
        size="large"
        color="#4EA8DE"
        style={{ marginTop: 30 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13131A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  logo: {
    fontSize: 80,
    marginBottom: 20,
  },

  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#7C7C8A',
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
  },
});
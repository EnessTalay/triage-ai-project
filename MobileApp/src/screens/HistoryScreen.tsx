import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await AsyncStorage.getItem('triageHistory');

      if (data) {
        setHistory(JSON.parse(data));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.complaint}>
        {item.complaint}
      </Text>

      <Text style={styles.result}>
        Triaj: {item.triage}
      </Text>

      <Text style={styles.date}>
        {item.date}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Geçmiş Analizler
      </Text>

      <FlatList
        data={history}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Henüz kayıt bulunmuyor.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13131A',
    padding: 20,
  },

  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#1C1C24',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#292938',
  },

  complaint: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

  result: {
    color: '#4EA8DE',
    marginTop: 8,
    fontSize: 14,
  },

  date: {
    color: '#7C7C8A',
    marginTop: 5,
    fontSize: 12,
  },

  empty: {
    color: '#7C7C8A',
    textAlign: 'center',
    marginTop: 50,
  },
});
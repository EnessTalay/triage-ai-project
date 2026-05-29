import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;
type ResultScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Result'>;

interface Props {
  route: ResultScreenRouteProp;
  navigation: ResultScreenNavigationProp;
}

export default function ResultScreen({ route, navigation }: Props) {
  const { complaint, triageResult } = route.params;

  // Triaj rengine göre UI renk şeması belirleme
  const getColorScheme = (color: string) => {
    switch (color) {
      case 'Kırmızı': return { main: '#FF4D4D', bg: '#2C1E1E', desc: 'ACİL - Hayati tehlike mevcut! Hemen müdahale edilmeli.' };
      case 'Sarı': return { main: '#FFB84D', bg: '#2C271E', desc: 'GECİKTİRİLEBİLİR ACİL - Durum stabil ancak risk yüksek.' };
      case 'Yeşil': return { main: '#4DFF4D', bg: '#1E2C1E', desc: 'AYAKTAN HASTA - Hayati tehlike bulunmuyor.' };
      default: return { main: '#4EA8DE', bg: '#1C1C24', desc: 'Belirlenemedi' };
    }
  };

  const scheme = getColorScheme(triageResult.triage_color);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Büyük Renkli Triaj Kartı */}
      <View style={[styles.colorCard, { backgroundColor: scheme.bg, borderColor: scheme.main }]}>
        <Text style={[styles.colorBadge, { backgroundColor: scheme.main }]}>
          {triageResult.triage_color.toUpperCase()} TRİAJ
        </Text>
        <Text style={styles.urgencyText}>Aciliyet Durumu: {triageResult.urgency}</Text>
        <Text style={styles.descText}>{scheme.desc}</Text>
      </View>

      {/* Bekleme Süresi */}
      <View style={styles.infoCard}>
        <Text style={styles.cardLabel}>Tahmini Ortalama Bekleme Süresi</Text>
        <Text style={styles.cardValue}>{triageResult.waiting_time}</Text>
      </View>

      {/* Riskli Kelimeler Var mı? */}
      {triageResult.risky_terms && triageResult.risky_terms.length > 0 && (
        <View style={[styles.infoCard, { borderColor: '#FF4D4D', borderWidth: 0.5 }]}>
          <Text style={[styles.cardLabel, { color: '#FF4D4D' }]}>⚠️ Saptanan Riskli İfadeler</Text>
          <View style={styles.badgeRow}>
            {triageResult.risky_terms.map((term, index) => (
              <Text key={index} style={styles.riskBadge}>{term}</Text>
            ))}
          </View>
        </View>
      )}

      {/* Girilen Şikayet Özeti */}
      <View style={styles.infoCard}>
        <Text style={styles.cardLabel}>Analiz Edilen Şikayet</Text>
        <Text style={styles.complaintText}>"{complaint}"</Text>
      </View>

      {/* Aksiyon Butonu - Haritaya Yönlendirme */}
      <TouchableOpacity 
        style={[styles.mapButton, { backgroundColor: scheme.main }]}
        onPress={() => navigation.navigate('Map', { triageColor: triageResult.triage_color })}
      >
        <Text style={styles.buttonText}>📍 En Yakın Sağlık Kuruluşlarını Göster</Text>
      </TouchableOpacity>

      <TouchableOpacity
  style={[styles.mapButton, { backgroundColor: '#292938', marginTop: 10 }]}
  onPress={() => navigation.navigate('History')}
>
  <Text style={[styles.buttonText, { color: '#FFF' }]}>
    📄 Geçmiş Analizleri Gör
  </Text>
</TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#13131A' },
  content: { padding: 20 },
  colorCard: { padding: 20, borderRadius: 12, borderWidth: 2, alignItems: 'center', marginBottom: 20 },
  colorBadge: { color: '#000', fontWeight: 'bold', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, fontSize: 18, overflow: 'hidden', marginBottom: 15 },
  urgencyText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  descText: { color: '#C4C4CC', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  infoCard: { backgroundColor: '#1C1C24', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#292938' },
  cardLabel: { color: '#7C7C8A', fontSize: 12, marginBottom: 5 },
  cardValue: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  complaintText: { color: '#C4C4CC', fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  riskBadge: { backgroundColor: 'rgba(255, 77, 77, 0.2)', color: '#FF4D4D', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginRight: 8, marginBottom: 8, fontSize: 12, fontWeight: 'bold' },
  mapButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' }
});
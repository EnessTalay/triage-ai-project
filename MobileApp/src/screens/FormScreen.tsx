import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { predictTriage } from '../api/triageApi';

type FormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Form'>;

interface Props {
  navigation: FormScreenNavigationProp;
}

export default function FormScreen({ navigation }: Props) {
  // Form State'leri
  const [complaint, setComplaint] = useState('');
  const [age, setAge] = useState('');
  const [hr, setHr] = useState(''); // Nabız
  const [bt, setBt] = useState(''); // Ateş
  const [sys, setSys] = useState(''); // Büyük Tansiyon
  const [dia, setDia] = useState(''); // Küçük Tansiyon
  const [spo2, setSpo2] = useState(''); // Satürasyon

  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    // 1. Form Validasyonu (Hata Yönetimi İsteri)
    if (!complaint.trim() || !age || !hr || !bt) {
      Alert.alert('Eksik Bilgi', 'Lütfen Şikayet, Yaş, Nabız ve Ateş alanlarını doldurun.');
      return;
    }

    setLoading(true);

    try {
      // API'ye gidecek veriyi hazırlıyoruz
      const requestData = {
        complaint: complaint,
        age: parseInt(age),
        hr: parseInt(hr),
        bt: parseFloat(bt),
        sys: sys ? parseInt(sys) : undefined,
        dia: dia ? parseInt(dia) : undefined,
        spo2: spo2 ? parseInt(spo2) : undefined,
      };

      // API Servis Katmanını çağırıyoruz (Servisten Veri Alma İsteri)
      const result = await predictTriage(requestData);
      
      setLoading(false);
      // Ekranlar arası veri aktarımı ile sonuç ekranına geçiyoruz
      navigation.navigate('Result', { complaint, triageResult: result });
      
    } catch (error: any) {
      setLoading(false);
      // API Çalışmıyor/Bağlantı Hatası Yönetimi
      Alert.alert('Bağlantı Hatası', error.message || 'Bir hata oluştu.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Hasta Şikayeti</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Şikayetinizi detaylıca yazınız... (Örn: Göğüste sıkışma hissi ve nefes darlığı)"
          placeholderTextColor="#7C7C8A"
          multiline
          numberOfLines={4}
          value={complaint}
          onChangeText={setComplaint}
        />

        <Text style={styles.sectionTitle}>Hayati Bulgular (Vital Signs)</Text>
        
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Yaş</Text>
            <TextInput 
              style={styles.input} 
              placeholder="45" 
              placeholderTextColor="#7C7C8A"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ateş (°C)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="37.5" 
              placeholderTextColor="#7C7C8A"
              keyboardType="numeric"
              value={bt}
              onChangeText={setBt}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nabız (HR)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="85" 
              placeholderTextColor="#7C7C8A"
              keyboardType="numeric"
              value={hr}
              onChangeText={setHr}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Satürasyon (SpO2)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="98" 
              placeholderTextColor="#7C7C8A"
              keyboardType="numeric"
              value={spo2}
              onChangeText={setSpo2}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Büyük Tansiyon</Text>
            <TextInput 
              style={styles.input} 
              placeholder="12" 
              placeholderTextColor="#7C7C8A"
              keyboardType="numeric"
              value={sys}
              onChangeText={setSys}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Küçük Tansiyon</Text>
            <TextInput 
              style={styles.input} 
              placeholder="8" 
              placeholderTextColor="#7C7C8A"
              keyboardType="numeric"
              value={dia}
              onChangeText={setDia}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleAnalyze}>
          <Text style={styles.buttonText}>Yapay Zeka ile Analiz Et</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Yükleniyor Spinner Katmanı (Loading / Hata Yönetimi İsteri) */}
      <Modal transparent={true} visible={loading} animationType="fade">
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4EA8DE" />
            <Text style={styles.loadingText}>Model Verileri İşliyor...</Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#13131A' },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#4EA8DE', marginTop: 15, marginBottom: 10 },
  label: { color: '#C4C4CC', fontSize: 12, marginBottom: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  inputGroup: { width: '48%' },
  input: { 
    backgroundColor: '#1C1C24', color: '#FFF', padding: 12, borderRadius: 8, 
    borderWidth: 1, borderColor: '#292938', fontSize: 14 
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: { backgroundColor: '#4EA8DE', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  loadingContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  loadingBox: { backgroundColor: '#1C1C24', padding: 30, borderRadius: 12, alignItems: 'center' },
  loadingText: { color: '#FFF', marginTop: 15, fontSize: 14 }
});
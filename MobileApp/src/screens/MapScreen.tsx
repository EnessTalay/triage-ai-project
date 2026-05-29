import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type MapScreenRouteProp = RouteProp<RootStackParamList, 'Map'>;

interface Props {
  route: MapScreenRouteProp;
}

export default function MapScreen({ route }: Props) {
  const { triageColor } = route.params;
  const [loading, setLoading] = useState(true);

  // Simüle edilmiş başlangıç konumu (Harita ve Konum Özelliği İsteri)
  const initialRegion = {
    latitude: 38.5012, 
    longitude: 43.3728,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Yakındaki hastanelerin listesi
  const hospitals = [
    { id: 1, title: 'Bölge Eğitim Araştırma Hastanesi', lat: 38.4850, lng: 43.3620, type: 'Tam Teşekküllü Acil' },
    { id: 2, title: 'Üniversite Tıp Fakültesi Hastanesi', lat: 38.5120, lng: 43.3850, type: 'Üniversite Hastanesi' },
    { id: 3, title: 'İlçe Devlet Hastanesi Acil Servisi', lat: 38.4980, lng: 43.3450, type: '7/24 Acil Servis' },
  ];

  useEffect(() => {
    // Haritanın yüklenmesini taklit eden mini bir loading
    const timer = setTimeout(() => setLoading(false), 1000);
    
    // Triaj rengi kırmızıysa kullanıcıya hemen uyarı verelim
    if (triageColor === 'Kırmızı') {
      Alert.alert('Hayati Uyarı', 'Triaj durumunuz KRİTİK olarak belirlenmiştir. Haritadaki en yakın tam teşekküllü acil servise başvurun!');
    }

    return () => clearTimeout(timer);
  }, [triageColor]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4EA8DE" />
        <Text style={styles.loadingText}>Harita ve Sağlık Kuruluşları Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Kullanıcının Bulunduğu Konum İşareti */}
        <Marker
          coordinate={{ latitude: initialRegion.latitude, longitude: initialRegion.longitude }}
          title="Sizin Konumunuz"
          description="Şu an buradasınız"
          pinColor="blue"
        />

        {/* Yakındaki Hastaneler */}
        {hospitals.map((hospital) => (
          <Marker
            key={hospital.id}
            coordinate={{ latitude: hospital.lat, longitude: hospital.lng }}
            title={hospital.title}
            description={hospital.type}
            pinColor="red"
          />
        ))}
      </MapView>
      <View style={styles.bottomBanner}>
        <Text style={styles.bannerText}>
          Triaj Seviyeniz: <Text style={{ fontWeight: 'bold' }}>{triageColor}</Text>
        </Text>
        <Text style={styles.subBannerText}>Haritada size en yakın 3 acil servis listelenmiştir.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, backgroundColor: '#13131A', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FFF', marginTop: 10 },
  bottomBanner: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    backgroundColor: '#1C1C24', padding: 15, borderRadius: 12,
    borderWidth: 1, borderColor: '#292938', elevation: 5
  },
  bannerText: { color: '#FFF', fontSize: 14 },
  subBannerText: { color: '#7C7C8A', fontSize: 12, marginTop: 4 }
});
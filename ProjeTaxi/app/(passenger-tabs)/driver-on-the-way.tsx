import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, Modal, ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CustomHeader } from '@/components/ui/CustomHeader';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { doc, onSnapshot, getFirestore, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { IconSymbol } from '@/components/ui/IconSymbol';

type Driver = {
  name: string;
  carModel: string;
  carPlate: string;
  eta: string;
  location: {
    latitude: number;
    longitude: number;
  };
};

type PassengerLocation = {
  latitude: number;
  longitude: number;
};

type Params = {
  driver: string;
  passengerLocation: string;
  rideRequestId: string;
  destination: string;
};

export default function DriverOnTheWayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const { user } = useAuth();
  const [driver, setDriver] = useState<Driver>(JSON.parse(params.driver));
  const [passengerLocation, setPassengerLocation] = useState<PassengerLocation>(JSON.parse(params.passengerLocation));
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [currentDriverPosition, setCurrentDriverPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: passengerLocation.latitude,
    longitude: passengerLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isLocationSet, setIsLocationSet] = useState(false);
  const [showCancelledModal, setShowCancelledModal] = useState(false);
  const [cancelledInfo, setCancelledInfo] = useState<{ cancelledAt: string; cancelledBy: string } | null>(null);
  const [showBoardingConfirmation, setShowBoardingConfirmation] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fare, setFare] = useState(0);

  // Yolcu konum bilgisini veritabanından al (sadece bir kez)
  useEffect(() => {
    if (!user?.uid || isLocationSet) return;

    const db = getFirestore();
    const userRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(userRef, (doc) => {
      const data = doc.data();
      console.log('DriverOnTheWay - Veritabanından alınan yolcu verisi:', data);
      if (data?.location?.coordinates && !isLocationSet) {
        console.log('DriverOnTheWay - Yolcu konum bilgisi:', data.location.coordinates);
        const newLocation = {
          latitude: data.location.coordinates.latitude,
          longitude: data.location.coordinates.longitude
        };
        setPassengerLocation(newLocation);
        setMapRegion(prev => ({
          ...prev,
          latitude: newLocation.latitude,
          longitude: newLocation.longitude
        }));
        setIsLocationSet(true);
        unsubscribe(); // Konum alındıktan sonra dinlemeyi durdur
      } else {
        console.log('DriverOnTheWay - Yolcu konum bilgisi bulunamadı');
      }
    });

    return () => unsubscribe();
  }, [user?.uid, isLocationSet]);

  // Sürüş durumunu dinle
  useEffect(() => {
    if (!params.rideRequestId) return;

    const db = getFirestore();
    const rideRequestRef = doc(db, 'rideRequests', params.rideRequestId);

    const unsubscribe = onSnapshot(rideRequestRef, async (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log('Gelen veri:', data);
        
        // Sürücü konumunu ayarla
        if (data.driver?.location?.coordinates) {
          const driverLocation = {
            latitude: Number(data.driver.location.coordinates[1] || data.driver.location.coordinates.latitude),
            longitude: Number(data.driver.location.coordinates[0] || data.driver.location.coordinates.longitude)
          };
          
          // NaN kontrolü
          if (isNaN(driverLocation.latitude) || isNaN(driverLocation.longitude)) {
            console.error('Geçersiz sürücü konumu:', data.driver.location.coordinates);
            return;
          }

          console.log('Sürücü konumu:', driverLocation);
          setCurrentDriverPosition(driverLocation);
          
          // Harita bölgesini sürücü konumuna ayarla
          setMapRegion({
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }

        // Rota koordinatlarını güncelle
        if (data.routeCoordinates) {
          setRouteCoordinates(data.routeCoordinates);
        }

        // Firestore'dan gelen mesafe, süre ve ücret değerlerini güncelle
        if (data.distance) {
          console.log('Mesafe güncelleniyor:', data.distance);
          setDistance(data.distance);
        }
        if (data.duration) {
          console.log('Süre güncelleniyor:', data.duration);
          setDuration(data.duration);
        }
        if (data.fare) {
          console.log('Ücret güncelleniyor:', data.fare);
          setFare(data.fare);
        }

        // Sürüş durumu değişikliklerini kontrol et
        if (data.status === 'completed') {
          // Yolcuyu ödeme sayfasına yönlendir
          router.replace({
            pathname: '/(passenger-tabs)/payment',
            params: { rideId: params.rideRequestId }
          });
        } else if (data.status === 'cancelled') {
          setShowCancelledModal(true);
          setCancelledInfo({
            cancelledAt: data.cancelledAt || new Date().toISOString(),
            cancelledBy: data.cancelledBy || 'unknown'
          });
        } else if (data.status === 'arrived') {
          // Varış noktasına ulaşıldı mesajını göster
          Alert.alert(
            'Varış Noktasına Ulaşıldı',
            'Varış noktasına ulaşıldı. Kartınızdan ödeme yapılıyor.',
            [{ text: 'Tamam' }]
          );
        }
      }
    });

    return () => unsubscribe();
  }, [params.rideRequestId]);

  const handleCancelRide = () => {
    router.push('/home');
  };

  const handleDismissCancelled = () => {
    setShowCancelledModal(false);
    router.replace('/home');
  };

  const handleBoardingConfirmation = async () => {
    try {
      const db = getFirestore();
      const rideRequestRef = doc(db, 'rideRequests', params.rideRequestId);
      
      await updateDoc(rideRequestRef, {
        passengerBoarded: true,
        passengerBoardedAt: new Date().toISOString()
      });

      setShowBoardingConfirmation(false);
      Alert.alert('Bilgi', 'Sürücüye bilgi verildi. Sürüş başlatılacak.');
    } catch (error) {
      console.error('Biniş onayı verilirken hata:', error);
      Alert.alert('Hata', 'Biniş onayı verilirken bir hata oluştu.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <CustomHeader 
        title="Sürücünüz Yolda"
        backgroundColor="#3572EF"
      />
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion}
          showsMyLocationButton={false}
          initialRegion={mapRegion}
        >
          {/* Yolcu konumu */}
          <Marker
            coordinate={passengerLocation}
            title="Konumunuz"
            description="Buluşma noktası"
            pinColor="#3572EF"
          />

          {/* Sürücü konumu */}
          {currentDriverPosition && (
            <Marker
              coordinate={currentDriverPosition}
              title="Sürücü"
              description="Sürücünüz burada"
            >
              <View style={styles.driverMarker}>
                <View style={styles.driverMarkerInner} />
              </View>
            </Marker>
          )}

          {/* Rota */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#3572EF"
              strokeWidth={3}
              lineDashPattern={[1]}
            />
          )}
        </MapView>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
          <View style={styles.driverInfo}>
          <ThemedText style={styles.title}>Sürücü Bilgileri</ThemedText>
          <ThemedText style={styles.infoText}>İsim: {driver?.name || 'İsimsiz Sürücü'}</ThemedText>
          <ThemedText style={styles.infoText}>Araç: {driver?.carModel || 'Araç Bilgisi Yok'}</ThemedText>
          <ThemedText style={styles.infoText}>Plaka: {driver?.carPlate || 'Plaka Bilgisi Yok'}</ThemedText>
            </View>
            
        <View style={styles.rideInfo}>
          <ThemedText style={styles.title}>Yolculuk Bilgileri</ThemedText>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Mesafe:</ThemedText>
              <ThemedText style={styles.infoValue}>{distance || '0'} km</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Süre:</ThemedText>
              <ThemedText style={styles.infoValue}>{duration || '0'} dk</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Ücret:</ThemedText>
              <ThemedText style={styles.infoValue}>{fare || '0'} TL</ThemedText>
            </View>
              </View>
              </View>
      </ScrollView>
              
      <Modal
        visible={showCancelledModal}
        transparent
        animationType="fade"
        onRequestClose={handleDismissCancelled}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <IconSymbol 
              size={48} 
              name="xmark.circle.fill" 
              color="#F44336" 
            />
            <ThemedText style={styles.modalTitle}>
              Yolculuk İptal Edildi
            </ThemedText>
            <ThemedText style={styles.modalMessage}>
              {cancelledInfo?.cancelledBy === 'driver' 
                ? 'Sürücü tarafından iptal edildi'
                : 'Sistem tarafından iptal edildi'}
            </ThemedText>
            <ThemedText style={styles.modalTime}>
              {cancelledInfo?.cancelledAt 
                ? new Date(cancelledInfo.cancelledAt).toLocaleTimeString('tr-TR')
                : ''}
            </ThemedText>
        <TouchableOpacity
              style={styles.modalButton}
              onPress={handleDismissCancelled}
        >
              <ThemedText style={styles.modalButtonText}>Tamam</ThemedText>
        </TouchableOpacity>
      </View>
        </View>
      </Modal>

      {driver && !showBoardingConfirmation && (
        <View style={styles.boardingConfirmation}>
          <TouchableOpacity
            style={styles.boardingButton}
            onPress={() => setShowBoardingConfirmation(true)}
          >
            <ThemedText style={styles.boardingButtonText}>Taksiye Bindim</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {showBoardingConfirmation && (
        <View style={styles.confirmationModal}>
          <View style={styles.confirmationContent}>
            <ThemedText style={styles.confirmationTitle}>Taksiye Bindiğinizi Onaylıyor musunuz?</ThemedText>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmationButton, styles.cancelButton]}
                onPress={() => setShowBoardingConfirmation(false)}
              >
                <ThemedText style={styles.buttonText}>Vazgeç</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmationButton, styles.confirmButton]}
                onPress={handleBoardingConfirmation}
              >
                <ThemedText style={styles.buttonText}>Onayla</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    height: '50%',
  },
  map: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  driverInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rideInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalTime: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#3572EF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  driverMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3572EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverMarkerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  boardingConfirmation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  boardingButton: {
    backgroundColor: '#3572EF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  boardingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmationModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  confirmationContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmationButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  confirmButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
  },
}); 
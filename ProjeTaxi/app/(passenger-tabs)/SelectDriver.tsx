import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, FlatList, Image, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Button } from '@rneui/themed';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { collection, query, where, getDocs, getFirestore, doc, getDoc, onSnapshot, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

type RootStackParamList = {
  SelectDriver: { 
    destination: { 
      display_name: string; 
      lat: number; 
      lon: number; 
    }; 
  };
  Home: undefined;
  'driver-on-the-way': { 
    driver: string;
    passengerLocation: string;
    rideRequestId?: string;
  };
};

type SelectDriverRouteProp = RouteProp<RootStackParamList, 'SelectDriver'>;

type Location = {
  latitude: number;
  longitude: number;
};

type Route = {
  coordinates: {
    latitude: number;
    longitude: number;
  }[];
};

type Driver = {
  id: string;
  name: string;
  phone: string;
  vehiclePlate: string;
  carModel: string;
  location: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  isOnline: boolean;
};

export default function SelectDriverScreen() {
  const route = useRoute<SelectDriverRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [mapRoute, setMapRoute] = useState<Route | null>(null);
  const [passengerLocation, setPassengerLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const { user } = useAuth();

  // Yolcu konum bilgisini veritabanından al
  useEffect(() => {
    if (!user?.uid) return;

    const db = getFirestore();
    const userRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(userRef, (doc) => {
      const data = doc.data();
      console.log('SelectDriver - Veritabanından alınan yolcu verisi:', data);
      if (data?.location?.coordinates) {
        console.log('SelectDriver - Yolcu konum bilgisi:', data.location.coordinates);
        setPassengerLocation({
          latitude: data.location.coordinates.latitude,
          longitude: data.location.coordinates.longitude
        });
      } else {
        console.log('SelectDriver - Yolcu konum bilgisi bulunamadı');
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Sürücüleri veritabanından getir
  useEffect(() => {
    const db = getFirestore();
    const driversRef = collection(db, 'users');
    const q = query(
      driversRef, 
      where('userType', '==', 'driver'),
      where('profileCompleted', '==', true),
      where('isOnline', '==', true)
    );

    setLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const driversData: Driver[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Ham sürücü verisi:', {
          id: doc.id,
          location: data.location,
          coordinates: data.location?.coordinates
        });

        if (data.location?.coordinates) {
          const latitude = typeof data.location.coordinates.latitude === 'number' 
            ? data.location.coordinates.latitude 
            : parseFloat(String(data.location.coordinates.latitude || 0));
          
          const longitude = typeof data.location.coordinates.longitude === 'number'
            ? data.location.coordinates.longitude
            : parseFloat(String(data.location.coordinates.longitude || 0));

          console.log('İşlenmiş koordinatlar:', { latitude, longitude });

          if (!isNaN(latitude) && !isNaN(longitude) && latitude !== 0 && longitude !== 0) {
            driversData.push({
              id: doc.id,
              name: data.name || 'Sürücü',
              phone: data.phone || '',
              vehiclePlate: data.vehiclePlate || 'Plaka Yok',
              carModel: data.carModel || 'Model Yok',
              location: {
                coordinates: {
                  latitude,
                  longitude,
                }
              },
              isOnline: data.isOnline || false
            });
          }
        }
      });
      console.log('İşlenmiş sürücü listesi:', driversData);
      setDrivers(driversData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSelectDriver = (driver: Driver) => {
    setSelectedDriver(driver);
  };

  const handleConfirmDriver = async () => {
    if (!user) {
      Alert.alert('Hata', 'Lütfen giriş yapın.');
      return;
    }

    if (!selectedDriver) {
      Alert.alert('Hata', 'Lütfen bir sürücü seçin.');
      return;
    }

    if (!passengerLocation) {
      Alert.alert('Hata', 'Yolcu konum bilgisi bulunamadı.');
      return;
    }

    if (!route.params?.destination) {
      Alert.alert('Hata', 'Varış noktası bilgisi bulunamadı.');
      return;
    }

    setRequestLoading(true);
    Alert.alert(
      'Talep Gönderiliyor',
      'Sürücüye yolculuk talebi gönderiliyor. Lütfen bekleyin...',
      [{ text: 'Tamam' }]
    );

    console.log('Sürüş talebi oluşturuluyor - Yolcu konumu:', passengerLocation);
    console.log('Varış noktası:', route.params.destination);

    try {
      const db = getFirestore();
      
      // Sürüş talebini veritabanına ekle
      const rideRequest = {
        passengerId: user?.uid,
        passengerName: user?.displayName || 'İsimsiz Yolcu',
        driverId: selectedDriver.id,
        driverName: selectedDriver.name,
        driver: {
          name: selectedDriver.name,
          carModel: selectedDriver.carModel,
          carPlate: selectedDriver.vehiclePlate,
          location: selectedDriver.location
        },
        status: 'pending',
        pickupLocation: {
          latitude: passengerLocation.latitude,
          longitude: passengerLocation.longitude
        },
        dropoffLocation: {
          latitude: route.params.destination.lat,
          longitude: route.params.destination.lon,
          display_name: route.params.destination.display_name
        },
        startLocation: null,
        endLocation: null,
        actualDistance: '0 km',
        actualDuration: '0 dk',
        calculatedFare: 0,
        routeCoordinates: [],
        passengerBoarded: false,
        passengerBoardedAt: null,
        startedAt: null,
        arrivedAt: null,
        completedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Oluşturulan sürüş talebi:', rideRequest);

      const docRef = await addDoc(collection(db, 'rideRequests'), rideRequest);

      Alert.alert(
        'Talep Gönderildi',
        'Sürücüye yolculuk talebi gönderildi. Sürücünün yanıtı bekleniyor...',
        [{ text: 'Tamam' }]
      );

      // Sürüş talebini dinle
      const unsubscribe = onSnapshot(doc(db, 'rideRequests', docRef.id), (doc) => {
        const data = doc.data();
        if (data) {
          switch (data.status) {
            case 'accepted':
              setRequestLoading(false);
              // Sürücü bilgilerini driver-on-the-way sayfasına gönder
              navigation.navigate('driver-on-the-way', {
                driver: JSON.stringify({
                  name: selectedDriver.name,
                  carModel: selectedDriver.carModel,
                  carPlate: selectedDriver.vehiclePlate,
                  location: {
                    latitude: selectedDriver.location.coordinates.latitude,
                    longitude: selectedDriver.location.coordinates.longitude
                  },
                  eta: '5 dakika' // Bu değer daha sonra gerçek hesaplama ile güncellenecek
                }),
                passengerLocation: JSON.stringify(passengerLocation),
                rideRequestId: docRef.id
              });
              unsubscribe(); // Dinlemeyi durdur
              break;
            case 'rejected':
              setRequestLoading(false);
              Alert.alert('Bilgi', 'Sürücü talebinizi reddetti. Başka bir sürücü seçebilirsiniz.');
              unsubscribe(); // Dinlemeyi durdur
              break;
            case 'cancelled':
              setRequestLoading(false);
              Alert.alert('Bilgi', 'Sürüş talebi iptal edildi.');
              unsubscribe(); // Dinlemeyi durdur
              break;
          }
        }
      });

    } catch (error) {
      setRequestLoading(false);
      console.error('Sürüş talebi oluşturulurken hata:', error);
      Alert.alert('Hata', 'Sürüş talebi oluşturulurken bir hata oluştu.');
    }
  };

  // Rota hesaplama fonksiyonu
  const calculateRoute = async (driverLocation: Location, passengerLocation: Location) => {
    try {
      // Düz çizgi oluştur
      const coordinates = [
        {
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude
        },
        {
          latitude: passengerLocation.latitude,
          longitude: passengerLocation.longitude
        }
      ];
      setMapRoute({ coordinates });
    } catch (error) {
      console.error('Rota hesaplanırken hata:', error);
    }
  };

  // Sürücü seçildiğinde rotayı hesapla
  useEffect(() => {
    if (selectedDriver && passengerLocation) {
      calculateRoute(
        {
          latitude: selectedDriver.location.coordinates.latitude,
          longitude: selectedDriver.location.coordinates.longitude
        },
        passengerLocation
      );
    }
  }, [selectedDriver, passengerLocation]);

  const renderDriverItem = ({ item }: { item: Driver }) => (
    <TouchableOpacity
      style={[
        styles.driverItem,
        selectedDriver?.id === item.id && styles.selectedDriverItem
      ]}
      onPress={() => handleSelectDriver(item)}
    >
      <View style={styles.driverInfo}>
        <ThemedText style={styles.driverName}>{item.name}</ThemedText>
        <ThemedText style={styles.vehiclePlate}>{item.vehiclePlate}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Sürücü Seç</ThemedText>
        <View style={styles.rightButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: passengerLocation?.latitude || 37.8719,
              longitude: passengerLocation?.longitude || 32.4843,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            {/* Varış noktası */}
            <Marker
              coordinate={{
                latitude: route.params.destination.lat,
                longitude: route.params.destination.lon,
              }}
              title="Varış Noktası"
              description={route.params.destination.display_name}
              pinColor="#C80036"
            />

            {/* Yolcu konumu */}
            {passengerLocation && (
              <Marker
                coordinate={{
                  latitude: passengerLocation.latitude,
                  longitude: passengerLocation.longitude,
                }}
                title="Konumunuz"
                pinColor="#3572EF"
              />
            )}

            {/* Sürücüler */}
            {drivers.map((driver) => {
              // Koordinatları kontrol et ve dönüştür
              const lat = typeof driver.location?.coordinates?.latitude === 'number' 
                ? driver.location.coordinates.latitude 
                : parseFloat(String(driver.location?.coordinates?.latitude || 0));
              
              const lng = typeof driver.location?.coordinates?.longitude === 'number'
                ? driver.location.coordinates.longitude
                : parseFloat(String(driver.location?.coordinates?.longitude || 0));

              // Geçerli koordinatları kontrol et
              if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                return null;
              }

              return (
                <Marker
                  key={driver.id}
                  coordinate={{
                    latitude: lat,
                    longitude: lng
                  }}
                  title={driver.name || 'Sürücü'}
                  description={driver.vehiclePlate || 'Plaka Yok'}
                  pinColor={selectedDriver?.id === driver.id ? '#3572EF' : '#FFA500'}
                />
              );
            })}

            {/* Seçilen sürücü için rota */}
            {mapRoute && (
              <Polyline
                coordinates={mapRoute.coordinates}
                strokeColor="#3572EF"
                strokeWidth={3}
              />
            )}
          </MapView>
        </View>

        <View style={styles.driversList}>
          <ThemedText style={styles.sectionTitle}>Müsait Sürücüler</ThemedText>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3572EF" />
              <ThemedText style={styles.loadingText}>Sürücüler yükleniyor...</ThemedText>
            </View>
          ) : drivers.length > 0 ? (
            <FlatList
              data={drivers}
              renderItem={renderDriverItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <IconSymbol name="car.fill" size={50} color="#ccc" />
              <ThemedText style={styles.emptyText}>
                Şu anda müsait sürücü bulunmuyor. Lütfen daha sonra tekrar deneyin.
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {selectedDriver && (
          <Button
            title={requestLoading ? "Talep Gönderiliyor..." : `${selectedDriver.name} ile Devam Et`}
            onPress={handleConfirmDriver}
            buttonStyle={styles.confirmButton}
            disabled={requestLoading}
            loading={requestLoading}
          />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#3572EF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  rightButton: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    height: 300,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  driversList: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  driverItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
  },
  selectedDriverItem: {
    backgroundColor: '#e6f0ff',
    borderColor: '#3572EF',
    borderWidth: 1,
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  confirmButton: {
    backgroundColor: '#3572EF',
    borderRadius: 8,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 
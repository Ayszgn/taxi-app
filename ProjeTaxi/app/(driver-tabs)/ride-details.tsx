import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, Dimensions, Modal, ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { doc, onSnapshot, getFirestore, updateDoc, getDoc } from 'firebase/firestore';

type RideRequest = {
  id: string;
  passengerName: string;
  passengerPhone: string;
  pickupLocation: {
    latitude: number;
    longitude: number;
    address?: string;
    display_name?: string;
  };
  dropoffLocation: {
    latitude: number;
    longitude: number;
    address?: string;
    display_name?: string;
  };
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  fare: number;
  distance: string;
  duration: string;
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  driver: {
    location: {
      latitude: number;
      longitude: number;
    };
  };
};

export default function RideDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideRequestId: string }>();
  const [rideRequest, setRideRequest] = useState<RideRequest | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [currentDriverPosition, setCurrentDriverPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [passengerPhone, setPassengerPhone] = useState<string>('');
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [mapRegion, setMapRegion] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [isAtPickupLocation, setIsAtPickupLocation] = useState(false);
  const [showCancelledModal, setShowCancelledModal] = useState(false);
  const [cancelledInfo, setCancelledInfo] = useState<{
    cancelledAt: string;
    cancelledBy: string;
  } | null>(null);
  const [simulationStep, setSimulationStep] = useState(0);
  const [passengerBoarded, setPassengerBoarded] = useState(false);
  const [distance, setDistance] = useState<string>('0 km');
  const [duration, setDuration] = useState<string>('0 dk');
  const [fare, setFare] = useState<number>(0);

  const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyAJ6lFjjbSzTVi9FA31ZaSk0YkA981fPu4`
      );
      const data = await response.json();
      if (data.results && data.results[0]) {
        return data.results[0].formatted_address;
      }
      return 'Adres bulunamadı';
    } catch (error) {
      console.error('Adres alınırken hata:', error);
      return 'Adres alınamadı';
    }
  };

  useEffect(() => {
    if (!params.rideRequestId) return;

    const db = getFirestore();
    const rideRequestRef = doc(db, 'rideRequests', params.rideRequestId);

    const unsubscribe = onSnapshot(rideRequestRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        console.log('Gelen veri:', data);

        // Yolcu telefon numarasını users koleksiyonundan al
        if (data.passengerId) {
          const passengerRef = doc(db, 'users', data.passengerId);
          const passengerDoc = await getDoc(passengerRef);
          if (passengerDoc.exists()) {
            const passengerData = passengerDoc.data() as { 
              phoneNumber?: string;
              location?: {
                coordinates?: {
                  latitude: number;
                  longitude: number;
                }
              }
            };
            setPassengerPhone(passengerData.phoneNumber || 'Telefon Yok');

            // Yolcunun konumunu adrese çevir
            if (passengerData.location?.coordinates?.latitude && passengerData.location?.coordinates?.longitude) {
              const address = await getAddressFromCoordinates(
                passengerData.location.coordinates.latitude,
                passengerData.location.coordinates.longitude
              );
              setPickupAddress(address);
            }
          }
        }

        // Alış noktası koordinatlarını adrese çevir
        if (data.pickup?.latitude && data.pickup?.longitude) {
          const address = await getAddressFromCoordinates(
            data.pickup.latitude,
            data.pickup.longitude
          );
          setPickupAddress(address);
        }

        // Yolcunun binme durumunu kontrol et
        if (data.passengerBoarded) {
          setPassengerBoarded(true);
        }

        // Mesafe, süre ve ücret bilgilerini state'lere aktar
        if (data.distance) setDistance(data.distance);
        if (data.duration) setDuration(data.duration);
        if (data.fare) setFare(data.fare);

        // Veri yapısını düzenle
        const formattedData: RideRequest = {
          id: snapshot.id,
          passengerName: data.passengerName || 'İsimsiz Yolcu',
          passengerPhone: passengerPhone,
          pickupLocation: {
            latitude: Number(data.pickup?.latitude || data.pickupLocation?.latitude || 0),
            longitude: Number(data.pickup?.longitude || data.pickupLocation?.longitude || 0),
            address: pickupAddress,
            display_name: pickupAddress
          },
          dropoffLocation: {
            latitude: Number(data.destination?.latitude || data.dropoffLocation?.latitude || 0),
            longitude: Number(data.destination?.longitude || data.dropoffLocation?.longitude || 0),
            address: data.destination?.display_name || data.dropoffLocation?.address || 'Bırakış Adresi Belirtilmemiş',
            display_name: data.destination?.display_name || data.dropoffLocation?.display_name
          },
          status: data.status || 'pending',
          fare: Number(data.fare || 0),
          distance: data.distance || '0 km',
          duration: data.duration || '0 dk',
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          acceptedAt: data.acceptedAt?.toDate?.()?.toISOString(),
          startedAt: data.startedAt?.toDate?.()?.toISOString(),
          driver: {
            location: {
              latitude: Number(data.driver?.location?.coordinates?.latitude || data.driver?.location?.coordinates?.[1] || 0),
              longitude: Number(data.driver?.location?.coordinates?.longitude || data.driver?.location?.coordinates?.[0] || 0)
            }
          }
        };

        console.log('Formatlanmış veri:', formattedData);
        setRideRequest(formattedData);

        // Sürücü konumunu ayarla
        if (formattedData.driver?.location?.latitude && formattedData.driver?.location?.longitude) {
          const driverLocation = {
            latitude: formattedData.driver.location.latitude,
            longitude: formattedData.driver.location.longitude
          };
          console.log('Sürücü konumu ayarlanıyor:', driverLocation);
          setCurrentDriverPosition(driverLocation);
          
          // Harita bölgesini sürücü konumuna ayarla
          setMapRegion({
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }

        // Simülasyon başladı bilgisini kontrol et
        if (data.simulationStarted && !isSimulating) {
          console.log('Simülasyon başlatma sinyali alındı');
          setIsSimulating(true);
        }

        // Sürüş durumu değişikliklerini kontrol et
        if (data.status === 'completed') {
          router.push('/(driver-tabs)/home');
        } else if (data.status === 'cancelled') {
          setShowCancelledModal(true);
          setCancelledInfo({
            cancelledAt: data.cancelledAt || new Date().toISOString(),
            cancelledBy: data.cancelledBy || 'unknown'
          });
        }
      }
    });

    return () => unsubscribe();
  }, [params.rideRequestId]);

  // Sürücü konumunu simüle et
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isSimulating && routeCoordinates.length > 0) {
      console.log('Simülasyon başlatıldı, adım:', simulationStep);
      
      intervalId = setInterval(() => {
        setSimulationStep(prevStep => {
          const nextStep = prevStep + 1;
          
          if (nextStep >= routeCoordinates.length) {
            clearInterval(intervalId);
            setIsSimulating(false);
            
            // Eğer yolcuya gidiyorsak
            if (!isAtPickupLocation) {
              setIsAtPickupLocation(true);
              Alert.alert(
                'Yolcu Konumuna Ulaşıldı',
                'Yolcuyu aldığınızda "Sürüşü Başlat" butonuna basabilirsiniz.',
                [{ text: 'Tamam' }]
              );
            } else if (rideRequest?.status === 'in_progress') {
              // Varış noktasına ulaşıldı
              Alert.alert(
                'Varış Noktasına Ulaşıldı',
                'Yolculuk tamamlandı.',
                [{ 
                  text: 'Tamam',
                  onPress: async () => {
                    try {
                      const db = getFirestore();
                      const rideRequestRef = doc(db, 'rideRequests', rideRequest?.id || '');
                      
                      // Önce varış noktasına ulaşıldı durumunu kaydet
                      await updateDoc(rideRequestRef, {
                        status: 'arrived',
                        arrivedAt: new Date().toISOString()
                      });

                      // 2 saniye bekle
                      await new Promise(resolve => setTimeout(resolve, 2000));

                      // Sürüşü tamamla
                      await updateDoc(rideRequestRef, {
                        status: 'completed',
                        completedAt: new Date().toISOString()
                      });
                      
                      // Ana sayfaya yönlendir
                      setTimeout(() => {
                        router.push('/(driver-tabs)/home');
                      }, 500);
                    } catch (error) {
                      console.error('Sürüş tamamlanırken hata:', error);
                      Alert.alert(
                        'Hata',
                        'Sürüş tamamlanırken bir hata oluştu. Lütfen tekrar deneyin.'
                      );
                    }
                  }
                }]
              );
            }
            return prevStep;
          }

          const nextPosition = routeCoordinates[nextStep];
          console.log('Sürücü konumu güncelleniyor:', nextPosition);
          
          // Sürücü konumunu güncelle
          setCurrentDriverPosition(nextPosition);
          
          // Harita bölgesini güncelle
          setMapRegion(prev => ({
            ...prev,
            latitude: nextPosition.latitude,
            longitude: nextPosition.longitude
          }));

          // Firestore'da sürücü konumunu güncelle
          if (rideRequest) {
            const db = getFirestore();
            const rideRequestRef = doc(db, 'rideRequests', rideRequest.id);
            updateDoc(rideRequestRef, {
              'driver.location.coordinates': [nextPosition.longitude, nextPosition.latitude]
            });
          }

          return nextStep;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isSimulating, routeCoordinates, rideRequest, isAtPickupLocation]);

  const startSimulation = async () => {
    if (!rideRequest || !currentDriverPosition || isSimulating) {
      console.log('Simülasyon başlatılamadı:', { 
        hasRideRequest: !!rideRequest, 
        hasDriverPosition: !!currentDriverPosition, 
        isSimulating 
      });
      return;
    }

    try {
      const db = getFirestore();
      const rideRequestRef = doc(db, 'rideRequests', rideRequest.id);
      
      // Simülasyon adımını sıfırla
      setSimulationStep(0);
      
      // Sürücünün yolcuya git butonuna bastığını kaydet
      await updateDoc(rideRequestRef, {
        driverStarted: true,
        driverStartedAt: new Date().toISOString(),
        simulationStarted: true,
        simulationStartTime: new Date().toISOString()
      });

      // Sürücüden yolcuya rota hesapla
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${currentDriverPosition.latitude},${currentDriverPosition.longitude}&destination=${rideRequest.pickupLocation.latitude},${rideRequest.pickupLocation.longitude}&mode=driving&key=AIzaSyAJ6lFjjbSzTVi9FA31ZaSk0YkA981fPu4`
      );
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const points = data.routes[0].overview_polyline.points;
        const coords = decodePolyline(points);
        
        // Başlangıç noktası olarak sürücünün mevcut konumunu ekle
        const routeWithStart = [currentDriverPosition, ...coords];
        console.log('Sürücüden yolcuya rota hesaplandı:', routeWithStart);
        
        // Rota koordinatlarını ayarla
        setRouteCoordinates(routeWithStart);

        // Firestore'a rota bilgilerini kaydet
        await updateDoc(rideRequestRef, {
          routeCoordinates: routeWithStart,
          currentRouteType: 'to_passenger',
          'driver.location.coordinates': [currentDriverPosition.longitude, currentDriverPosition.latitude]
        });

        // Simülasyonu başlat
        setIsSimulating(true);
      }
    } catch (error) {
      console.error('Simülasyon başlatılırken hata:', error);
      setIsSimulating(false);
      Alert.alert(
        'Hata',
        'Simülasyon başlatılırken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    }
  };

  const startRide = async () => {
    if (!rideRequest || !isAtPickupLocation || !passengerBoarded) return;

    try {
      const db = getFirestore();
      const rideRequestRef = doc(db, 'rideRequests', rideRequest.id);

      // Yolcudan varış noktasına rota hesapla
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${rideRequest.pickupLocation.latitude},${rideRequest.pickupLocation.longitude}&destination=${rideRequest.dropoffLocation.latitude},${rideRequest.dropoffLocation.longitude}&mode=driving&key=AIzaSyAJ6lFjjbSzTVi9FA31ZaSk0YkA981fPu4`
      );
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const points = data.routes[0].overview_polyline.points;
        const coords = decodePolyline(points);
        
        // Başlangıç noktası olarak yolcu konumunu ekle
        const routeWithStart = [rideRequest.pickupLocation, ...coords];
        console.log('Yolcudan varış noktasına rota hesaplandı:', routeWithStart);
        
        // Rota koordinatlarını ayarla
        setRouteCoordinates(routeWithStart);

        // Mesafe ve süre bilgilerini al
        const distance = data.routes[0].legs[0].distance.text;
        const duration = data.routes[0].legs[0].duration.text;
        
        // Mesafeyi km cinsinden sayıya çevir
        const distanceInKm = parseFloat(distance.replace(' km', ''));
        
        // Ücret hesapla (km başına 5 TL)
        const calculatedFare = Math.round(distanceInKm * 5);

        // State'leri güncelle
        setDistance(distance);
        setDuration(duration);
        setFare(calculatedFare);

        // Simülasyon adımını sıfırla
        setSimulationStep(0);

        // Sürüşü başlat ve yeni rotayı kaydet
        const updateData = {
          status: 'in_progress',
          startedAt: new Date().toISOString(),
          routeCoordinates: routeWithStart.map(coord => ({
            latitude: coord.latitude,
            longitude: coord.longitude
          })),
          currentRouteType: 'to_destination',
          'driver.location.coordinates': [
            rideRequest.pickupLocation.longitude,
            rideRequest.pickupLocation.latitude
          ],
          distance: distance,
          duration: duration,
          fare: calculatedFare,
          startLocation: {
            latitude: rideRequest.pickupLocation.latitude,
            longitude: rideRequest.pickupLocation.longitude,
            timestamp: new Date().toISOString()
          }
        };

        console.log('Firestore güncelleme verisi:', updateData);
        await updateDoc(rideRequestRef, updateData);

        // Simülasyonu başlat
        setIsSimulating(true);
      }
    } catch (error) {
      console.error('Sürüş başlatılırken hata:', error);
      Alert.alert(
        'Hata',
        'Sürüş başlatılırken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    }
  };

  const handleStartRide = async () => {
    if (!rideRequest) return;

    if (!currentDriverPosition) {
      Alert.alert(
        'Uyarı',
        'Önce yolcu konumuna gitmelisiniz. Simülasyonu başlatmak için "Yolcuya Git" butonuna basın.',
        [{ text: 'Tamam' }]
      );
      return;
    }

    Alert.alert(
      'Sürüşü Başlat',
      'Yolcuyu aldığınızı ve sürüşü başlatmak istediğinizi onaylıyor musunuz?',
      [
        {
          text: 'Vazgeç',
          style: 'cancel'
        },
        {
          text: 'Başlat',
          onPress: startRide
        }
      ]
    );
  };

  const handleCancelRide = async () => {
    if (!rideRequest) return;

    Alert.alert(
      'Sürüşü İptal Et',
      'Sürüşü iptal etmek istediğinizden emin misiniz?',
      [
        {
          text: 'Vazgeç',
          style: 'cancel'
        },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getFirestore();
              const rideRequestRef = doc(db, 'rideRequests', rideRequest.id);
              
              await updateDoc(rideRequestRef, {
                status: 'cancelled',
                cancelledAt: new Date().toISOString(),
                cancelledBy: 'driver',
                cancelReason: 'Sürücü tarafından iptal edildi'
              });

              Alert.alert(
                'Sürüş İptal Edildi',
                'Ana sayfaya yönlendiriliyorsunuz.',
                [{ 
                  text: 'Tamam',
                  onPress: () => router.push('/(driver-tabs)/home')
                }]
              );
            } catch (error) {
              console.error('Sürüş iptal edilirken hata:', error);
              Alert.alert(
                'Hata',
                'Sürüş iptal edilirken bir hata oluştu. Lütfen tekrar deneyin.'
              );
            }
          }
        }
      ]
    );
  };

  const decodePolyline = (encoded: string) => {
    try {
      const poly = [];
      let index = 0;
      let len = encoded.length;
      let lat = 0;
      let lng = 0;

      while (index < len) {
        let b;
        let shift = 0;
        let result = 0;

        do {
          b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);

        let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;

        do {
          b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);

        let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        poly.push({
          latitude: lat * 1e-5,
          longitude: lng * 1e-5
        });
      }

      console.log('Decode edilen polyline:', poly);
      return poly;
    } catch (error) {
      console.error('Polyline decode hatası:', error);
      return [];
    }
  };

  const handleDismissCancelled = () => {
    setShowCancelledModal(false);
    router.push('/(driver-tabs)/home');
  };

  // Buton durumunu kontrol et
  useEffect(() => {
    console.log('Buton Durumu:', {
      isSimulating,
      isAtPickupLocation,
      hasRideRequest: !!rideRequest,
      hasDriverPosition: !!currentDriverPosition
    });
  }, [isSimulating, isAtPickupLocation, rideRequest, currentDriverPosition]);

  // Varış noktasına ulaşıldığında çalışacak fonksiyonu güncelle
  const handleArrival = async () => {
    try {
      const db = getFirestore();
      const rideRequestRef = doc(db, 'rideRequests', rideRequest?.id || '');
      
      // Varış konumunu ve zamanını kaydet
      const endLocation = {
        latitude: rideRequest?.dropoffLocation.latitude,
        longitude: rideRequest?.dropoffLocation.longitude,
        timestamp: new Date().toISOString()
      };

      // Önce varış noktasına ulaşıldı durumunu kaydet
      await updateDoc(rideRequestRef, {
        status: 'arrived',
        arrivedAt: new Date().toISOString(),
        endLocation: endLocation
      });

      // 2 saniye bekle
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Sürüşü tamamla
      await updateDoc(rideRequestRef, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      // Ana sayfaya yönlendir
      setTimeout(() => {
        router.push('/(driver-tabs)/home');
      }, 500);
    } catch (error) {
      console.error('Sürüş tamamlanırken hata:', error);
      Alert.alert(
        'Hata',
        'Sürüş tamamlanırken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    }
  };

  if (!rideRequest) {
    return (
      <ThemedView style={styles.container}>
        <CustomHeader title="Yolculuk Detayları" backgroundColor="#3572EF" />
        <View style={styles.loadingContainer}>
          <ThemedText>Yükleniyor...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <CustomHeader title="Yolculuk Detayları" backgroundColor="#3572EF" />

      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion}
          showsMyLocationButton={false}
          initialRegion={mapRegion}
        >
          {/* Alış noktası */}
          {rideRequest?.pickupLocation && (
            <Marker
              coordinate={{
                latitude: rideRequest.pickupLocation.latitude,
                longitude: rideRequest.pickupLocation.longitude
              }}
              title="Alış Noktası"
              description={rideRequest.pickupLocation.address || rideRequest.pickupLocation.display_name}
              pinColor="#3572EF"
            />
          )}

          {/* Bırakış noktası */}
          {rideRequest?.dropoffLocation && (
            <Marker
              coordinate={{
                latitude: rideRequest.dropoffLocation.latitude,
                longitude: rideRequest.dropoffLocation.longitude
              }}
              title="Bırakış Noktası"
              description={rideRequest.dropoffLocation.address || rideRequest.dropoffLocation.display_name}
              pinColor="#C80036"
            />
          )}

          {/* Sürücü konumu */}
          {currentDriverPosition && (
            <Marker
              coordinate={currentDriverPosition}
              title="Sürücü"
              description="Konumunuz"
              anchor={{ x: 0.5, y: 0.5 }}
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
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Yolcu Bilgileri</ThemedText>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>İsim:</ThemedText>
              <ThemedText style={styles.infoValue}>{rideRequest.passengerName}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Telefon:</ThemedText>
              <ThemedText style={styles.infoValue}>{passengerPhone}</ThemedText>
            </View>
          </View>

          <View style={styles.rideInfo}>
            <ThemedText style={styles.title}>Yolculuk Bilgileri</ThemedText>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Mesafe:</ThemedText>
              <ThemedText style={styles.infoValue}>{distance}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Süre:</ThemedText>
              <ThemedText style={styles.infoValue}>{duration}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Ücret:</ThemedText>
              <ThemedText style={styles.infoValue}>{fare} TL</ThemedText>
            </View>
          </View>

          <View style={styles.locationInfo}>
            <ThemedText style={styles.title}>Konum Bilgileri</ThemedText>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Alış:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {pickupAddress || 'Adres yükleniyor...'}
              </ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Bırakış:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {rideRequest?.dropoffLocation?.display_name || rideRequest?.dropoffLocation?.address || 'Bırakış Adresi Belirtilmemiş'}
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancelRide}
        >
          <ThemedText style={styles.buttonText}>İptal Et</ThemedText>
        </TouchableOpacity>

        {!isSimulating && !isAtPickupLocation && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={startSimulation}
            disabled={isSimulating}
          >
            <ThemedText style={styles.buttonText}>Yolcuya Git</ThemedText>
          </TouchableOpacity>
        )}

        {isAtPickupLocation && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              !passengerBoarded && styles.disabledButton
            ]}
            onPress={handleStartRide}
            disabled={!passengerBoarded}
          >
            <ThemedText style={styles.buttonText}>
              {passengerBoarded ? 'Sürüşü Başlat' : 'Yolcu Binme Onayı Bekleniyor'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

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
              {cancelledInfo?.cancelledBy === 'passenger' 
                ? 'Yolcu tarafından iptal edildi'
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: '40%',
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
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
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
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
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
  locationInfo: {
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    paddingVertical: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    minHeight: 46,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#3572EF',
  },
  cancelButton: {
    backgroundColor: '#C80036',
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 1,
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
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
}); 
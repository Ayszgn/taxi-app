import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CustomHeader } from '@/components/ui/CustomHeader';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { doc, onSnapshot, getFirestore, updateDoc } from 'firebase/firestore';

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
};

export default function RideInProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideRequestId: string }>();
  const [rideRequest, setRideRequest] = useState<RideRequest | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [currentDriverPosition, setCurrentDriverPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (!params.rideRequestId) return;

    const db = getFirestore();
    const rideRequestRef = doc(db, 'rideRequests', params.rideRequestId);

    const unsubscribe = onSnapshot(rideRequestRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const formattedData: RideRequest = {
          id: doc.id,
          passengerName: data.passengerName || 'İsimsiz Yolcu',
          passengerPhone: data.passengerPhone || 'Telefon Yok',
          pickupLocation: {
            latitude: Number(data.pickup?.latitude || data.pickupLocation?.latitude || 0),
            longitude: Number(data.pickup?.longitude || data.pickupLocation?.longitude || 0),
            address: data.pickup?.display_name || data.pickupLocation?.address || 'Alış Adresi Belirtilmemiş',
            display_name: data.pickup?.display_name || data.pickupLocation?.display_name
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
          startedAt: data.startedAt?.toDate?.()?.toISOString()
        };

        setRideRequest(formattedData);

        if (formattedData.pickupLocation.latitude && formattedData.pickupLocation.longitude) {
          setMapRegion({
            latitude: formattedData.pickupLocation.latitude,
            longitude: formattedData.pickupLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });

          updateRouteCoordinates(formattedData.pickupLocation, formattedData.dropoffLocation);
        }

        if (formattedData.status === 'completed') {
          router.replace('/(driver-tabs)/ride-completed' as any);
        } else if (formattedData.status === 'cancelled') {
          router.replace('/(driver-tabs)/home' as any);
        }
      }
    });

    return () => unsubscribe();
  }, [params.rideRequestId]);

  const startSimulation = async () => {
    if (!rideRequest) return;
    
    try {
      const initialDriverPosition = {
        latitude: rideRequest.pickupLocation.latitude,
        longitude: rideRequest.pickupLocation.longitude
      };

      console.log('Başlangıç sürücü konumu:', initialDriverPosition);
      console.log('Bırakış konumu:', rideRequest.dropoffLocation);

      if (isNaN(initialDriverPosition.latitude) || isNaN(initialDriverPosition.longitude) ||
          isNaN(rideRequest.dropoffLocation.latitude) || isNaN(rideRequest.dropoffLocation.longitude)) {
        throw new Error('Geçersiz koordinatlar');
      }

      setCurrentDriverPosition(initialDriverPosition);

      const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${initialDriverPosition.latitude},${initialDriverPosition.longitude}&destination=${rideRequest.dropoffLocation.latitude},${rideRequest.dropoffLocation.longitude}&mode=driving&key=AIzaSyAJ6lFjjbSzTVi9FA31ZaSk0YkA981fPu4`;
      
      console.log('API URL:', apiUrl);

      const response = await fetch(apiUrl);
      const data = await response.json();

      console.log('API Yanıtı:', data);

      if (data.status === 'OK' && data.routes && data.routes[0]) {
        const points = data.routes[0].overview_polyline.points;
        const coords = decodePolyline(points);
        
        console.log('Oluşturulan rota koordinatları:', coords);

        if (coords.length === 0) {
          throw new Error('Rota koordinatları boş');
        }

        setRouteCoordinates(coords);
        
        setMapRegion({
          latitude: initialDriverPosition.latitude,
          longitude: initialDriverPosition.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        setIsSimulating(true);
      } else {
        console.error('API Hata Durumu:', data.status);
        console.error('API Hata Mesajı:', data.error_message);
        throw new Error(`Rota bulunamadı: ${data.status}`);
      }
    } catch (error) {
      console.error('Rota hesaplanırken hata:', error);
      Alert.alert(
        'Hata',
        'Rota hesaplanırken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    }
  };

  useEffect(() => {
    if (!isSimulating || !routeCoordinates.length || !rideRequest) return;

    let currentIndex = 0;
    const moveInterval = setInterval(() => {
      if (currentIndex < routeCoordinates.length - 1) {
        const nextPosition = routeCoordinates[currentIndex + 1];
        setCurrentDriverPosition(nextPosition);
        setMapRegion(prev => ({
          ...prev,
          latitude: nextPosition.latitude,
          longitude: nextPosition.longitude
        }));
        currentIndex++;

        if (currentIndex === routeCoordinates.length - 1) {
          clearInterval(moveInterval);
          setIsSimulating(false);
          handleCompleteRide();
        }
      } else {
        clearInterval(moveInterval);
        setIsSimulating(false);
      }
    }, 1000);

    return () => clearInterval(moveInterval);
  }, [isSimulating, routeCoordinates, rideRequest]);

  const handleCompleteRide = async () => {
    if (!rideRequest) return;

    try {
      const db = getFirestore();
      const rideRequestRef = doc(db, 'rideRequests', rideRequest.id);
      
      await updateDoc(rideRequestRef, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      router.replace('/(driver-tabs)/ride-completed' as any);
    } catch (error) {
      console.error('Sürüş tamamlanırken hata:', error);
      Alert.alert(
        'Hata',
        'Sürüş tamamlanırken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    }
  };

  const updateRouteCoordinates = async (pickup: { latitude: number; longitude: number }, dropoff: { latitude: number; longitude: number }) => {
    try {
      console.log('Rota güncelleniyor:', { pickup, dropoff });

      if (isNaN(pickup.latitude) || isNaN(pickup.longitude) ||
          isNaN(dropoff.latitude) || isNaN(dropoff.longitude)) {
        console.error('Geçersiz koordinatlar');
        return;
      }

      const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${pickup.latitude},${pickup.longitude}&destination=${dropoff.latitude},${dropoff.longitude}&mode=driving&key=AIzaSyAJ6lFjjbSzTVi9FA31ZaSk0YkA981fPu4`;
      
      console.log('API URL:', apiUrl);

      const response = await fetch(apiUrl);
      const data = await response.json();

      console.log('API Yanıtı:', data);

      if (data.status === 'OK' && data.routes && data.routes[0]) {
        const points = data.routes[0].overview_polyline.points;
        const coords = decodePolyline(points);
        
        console.log('Oluşturulan rota koordinatları:', coords);

        if (coords.length > 0) {
          setRouteCoordinates(coords);
        } else {
          console.error('Rota koordinatları boş');
        }
      } else {
        console.error('API Hata Durumu:', data.status);
        console.error('API Hata Mesajı:', data.error_message);
      }
    } catch (error) {
      console.error('Rota güncellenirken hata:', error);
    }
  };

  const decodePolyline = (encoded: string) => {
    try {
      const poly = [];
      let index = 0;
      let len = encoded.length;
      let lat = 0;
      let lng = 0;

      while (index < len) {
        let shift = 0;
        let result = 0;

        do {
          let b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (encoded.charCodeAt(index - 1) >= 0x20);

        let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;

        do {
          let b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (encoded.charCodeAt(index - 1) >= 0x20);

        let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        poly.push({
          latitude: lat / 1E5,
          longitude: lng / 1E5
        });
      }

      console.log('Decode edilen polyline:', poly);
      return poly;
    } catch (error) {
      console.error('Polyline decode hatası:', error);
      throw new Error('Polyline decode edilemedi');
    }
  };

  if (!rideRequest) {
    return (
      <ThemedView style={styles.container}>
        <CustomHeader title="Yolculuk Devam Ediyor" backgroundColor="#3572EF" />
        <View style={styles.loadingContainer}>
          <ThemedText>Yükleniyor...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <CustomHeader title="Yolculuk Devam Ediyor" backgroundColor="#3572EF" />

      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion}
          showsMyLocationButton={false}
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

      <View style={styles.infoContainer}>
        <View style={styles.passengerInfo}>
          <ThemedText style={styles.title}>Yolcu Bilgileri</ThemedText>
          <ThemedText style={styles.infoText}>İsim: {rideRequest?.passengerName}</ThemedText>
          <ThemedText style={styles.infoText}>Telefon: {rideRequest?.passengerPhone}</ThemedText>
        </View>

        <View style={styles.rideInfo}>
          <ThemedText style={styles.title}>Yolculuk Bilgileri</ThemedText>
          <ThemedText style={styles.infoText}>Mesafe: {rideRequest?.distance}</ThemedText>
          <ThemedText style={styles.infoText}>Süre: {rideRequest?.duration}</ThemedText>
          <ThemedText style={styles.infoText}>Ücret: {rideRequest?.fare} TL</ThemedText>
        </View>

        <View style={styles.locationInfo}>
          <ThemedText style={styles.title}>Konum Bilgileri</ThemedText>
          <ThemedText style={styles.infoText}>
            Alış: {rideRequest?.pickupLocation?.address || rideRequest?.pickupLocation?.display_name}
          </ThemedText>
          <ThemedText style={styles.infoText}>
            Bırakış: {rideRequest?.dropoffLocation?.address || rideRequest?.dropoffLocation?.display_name}
          </ThemedText>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {!isSimulating ? (
          <TouchableOpacity 
            style={[styles.button, styles.startButton]}
            onPress={startSimulation}
          >
            <ThemedText style={styles.buttonText}>Yolculuğu Başlat</ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.button, styles.completeButton]}
            onPress={handleCompleteRide}
          >
            <ThemedText style={styles.buttonText}>Yolculuğu Tamamla</ThemedText>
          </TouchableOpacity>
        )}
      </View>
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
  infoContainer: {
    flex: 1,
    padding: 16,
  },
  passengerInfo: {
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
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#3572EF',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
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
});
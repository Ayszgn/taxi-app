import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface Location {
  latitude: number;
  longitude: number;
}

interface RideSimulationProps {
  rideId: string;
  passengerLocation: Location;
  destination: Location;
  onRideComplete: () => void;
}

export function RideSimulation({ 
  rideId,
  passengerLocation, 
  destination,
  onRideComplete 
}: RideSimulationProps) {
  const [simulatedLocation, setSimulatedLocation] = useState<Location | null>(null);
  const [rideStatus, setRideStatus] = useState<'picking_up' | 'in_progress' | 'completed'>('picking_up');
  const colorScheme = useColorScheme();
  const mapRef = useRef<MapView>(null);
  const animationRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Yolculuk durumunu dinle
    const unsubscribe = onSnapshot(doc(db, 'rides', rideId), (doc) => {
      const rideData = doc.data();
      if (rideData) {
        const { status } = rideData;
        
        if (status) {
          setRideStatus(status);
          
          // Yolculuk durumuna göre simülasyonu başlat
          if (status === 'picking_up' && !simulatedLocation) {
            startSimulation(passengerLocation);
          } else if (status === 'in_progress') {
            startSimulation(destination);
          } else if (status === 'completed') {
            if (animationRef.current) {
              clearInterval(animationRef.current);
            }
            onRideComplete();
          }
        }
      }
    });

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      unsubscribe();
    };
  }, [rideId, passengerLocation, destination]);

  const startSimulation = (targetLocation: Location) => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    // Başlangıç konumu (örnek olarak sabit bir nokta)
    const startLocation: Location = {
      latitude: 41.0082,
      longitude: 28.9784
    };

    setSimulatedLocation(startLocation);

    // Her 2 saniyede bir konumu güncelle
    animationRef.current = setInterval(() => {
      setSimulatedLocation(currentLocation => {
        if (!currentLocation) return startLocation;

        // Hedefe doğru küçük bir adım at
        const latDiff = targetLocation.latitude - currentLocation.latitude;
        const lngDiff = targetLocation.longitude - currentLocation.longitude;
        
        const nextLocation = {
          latitude: currentLocation.latitude + (latDiff * 0.1),
          longitude: currentLocation.longitude + (lngDiff * 0.1)
        };

        // Hedefe yaklaşıldı mı kontrol et
        if (isNearLocation(nextLocation, targetLocation)) {
          if (animationRef.current) {
            clearInterval(animationRef.current);
          }
          return targetLocation;
        }

        return nextLocation;
      });
    }, 2000);
  };

  const isNearLocation = (loc1: Location, loc2: Location): boolean => {
    const latDiff = Math.abs(loc1.latitude - loc2.latitude);
    const lngDiff = Math.abs(loc1.longitude - loc2.longitude);
    return latDiff < 0.0001 && lngDiff < 0.0001;
  };

  if (!simulatedLocation) {
    return (
      <View style={styles.container}>
        <ThemedText style={styles.loadingText}>Yükleniyor...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: simulatedLocation.latitude,
          longitude: simulatedLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Simüle edilmiş sürücü konumu */}
        <Marker
          coordinate={simulatedLocation}
          title="Sürücü"
        >
          <IconSymbol 
            size={32} 
            name="car.fill" 
            color={Colors[colorScheme ?? 'light'].tint} 
          />
        </Marker>

        {/* Yolcu konumu */}
        <Marker
          coordinate={passengerLocation}
          title="Yolcu"
        >
          <IconSymbol 
            size={32} 
            name="person.fill" 
            color="#4CAF50" 
          />
        </Marker>

        {/* Varış noktası */}
        <Marker
          coordinate={destination}
          title="Varış Noktası"
        >
          <IconSymbol 
            size={32} 
            name="mappin.circle.fill" 
            color="#F44336" 
          />
        </Marker>
      </MapView>

      <View style={styles.statusContainer}>
        <IconSymbol 
          size={24} 
          name={rideStatus === 'picking_up' ? 'person.fill' : 'mappin.circle.fill'} 
          color={Colors[colorScheme ?? 'light'].tint} 
        />
        <ThemedText style={styles.statusText}>
          {rideStatus === 'picking_up' 
            ? 'Sürücü yolcu almak için geliyor...' 
            : rideStatus === 'in_progress' 
              ? 'Varış noktasına gidiliyor...' 
              : 'Yolculuk tamamlandı'}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  statusContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
}); 
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface Location {
  latitude: number;
  longitude: number;
}

interface DriverSimulationProps {
  rideId: string;
  initialLocation: Location;
  passengerLocation: Location;
  destination: Location;
  onSimulationComplete: () => void;
}

export function DriverSimulation({
  rideId,
  initialLocation,
  passengerLocation,
  destination,
  onSimulationComplete
}: DriverSimulationProps) {
  const [currentLocation, setCurrentLocation] = useState<Location>(initialLocation);
  const [status, setStatus] = useState<'picking_up' | 'in_progress' | 'completed'>('picking_up');
  const colorScheme = useColorScheme();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      await moveToNextLocation();
    }, 2000); // Her 2 saniyede bir konum güncelle

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentLocation, status]);

  const moveToNextLocation = async () => {
    try {
      let nextLocation: Location;
      let nextStatus = status;

      if (status === 'picking_up') {
        // Yolcuya doğru hareket et
        nextLocation = calculateNextLocation(currentLocation, passengerLocation);
        
        // Yolcuya ulaşıldı mı kontrol et
        if (isNearLocation(nextLocation, passengerLocation)) {
          nextStatus = 'in_progress';
        }
      } else if (status === 'in_progress') {
        // Varış noktasına doğru hareket et
        nextLocation = calculateNextLocation(currentLocation, destination);
        
        // Varış noktasına ulaşıldı mı kontrol et
        if (isNearLocation(nextLocation, destination)) {
          nextStatus = 'completed';
        }
      } else {
        // Yolculuk tamamlandı
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        onSimulationComplete();
        return;
      }

      // Konumu ve durumu güncelle
      setCurrentLocation(nextLocation);
      setStatus(nextStatus);

      // Firebase'i güncelle
      const rideRef = doc(db, 'rides', rideId);
      await updateDoc(rideRef, {
        driverLocation: nextLocation,
        status: nextStatus
      });

    } catch (error) {
      console.error('Simülasyon hatası:', error);
    }
  };

  const calculateNextLocation = (current: Location, target: Location): Location => {
    // Hedefe doğru küçük bir adım at
    const latDiff = target.latitude - current.latitude;
    const lngDiff = target.longitude - current.longitude;
    
    return {
      latitude: current.latitude + (latDiff * 0.1),
      longitude: current.longitude + (lngDiff * 0.1)
    };
  };

  const isNearLocation = (loc1: Location, loc2: Location): boolean => {
    // İki konum arasındaki mesafeyi hesapla (basit versiyon)
    const latDiff = Math.abs(loc1.latitude - loc2.latitude);
    const lngDiff = Math.abs(loc1.longitude - loc2.longitude);
    return latDiff < 0.0001 && lngDiff < 0.0001;
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <IconSymbol 
          size={24} 
          name={status === 'picking_up' ? 'person.fill' : 'mappin.circle.fill'} 
          color={Colors[colorScheme ?? 'light'].tint} 
        />
        <ThemedText style={styles.statusText}>
          {status === 'picking_up' 
            ? 'Yolcu alınıyor...' 
            : status === 'in_progress' 
              ? 'Varış noktasına gidiliyor...' 
              : 'Yolculuk tamamlandı'}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  statusContainer: {
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
}); 
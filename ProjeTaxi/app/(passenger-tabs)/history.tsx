import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { doc as firestoreDoc, getDoc, getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

interface RideHistory {
  id: string;
  driverId: string;
  driverName: string;
  status: 'accepted' | 'completed';
  pickup: {
    latitude: number;
    longitude: number;
  };
  dropoffLocation: {
    latitude: number;
    longitude: number;
    display_name: string;
  };
  createdAt: any;
  acceptedAt?: any;
  completedAt?: any;
  rating?: number;
  comment?: string;
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const [rideHistory, setRideHistory] = useState<RideHistory[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!user?.uid) return;

    const db = getFirestore();
    const requestsRef = collection(db, 'rideRequests');
    const q = query(
      requestsRef,
      where('passengerId', '==', user.uid),
      where('status', 'in', ['accepted', 'completed'])
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rides: RideHistory[] = [];
      
      for (const doc of snapshot.docs) {
        const rideData = doc.data();
        console.log('Ride Data:', JSON.stringify(rideData, null, 2));
        
        // Sürücü bilgilerini al
        let driverName = 'Bilinmeyen Sürücü';
        if (rideData.driverId) {
          const driverDoc = await getDoc(firestoreDoc(db, 'users', rideData.driverId));
          if (driverDoc.exists()) {
            const driverData = driverDoc.data() as { name?: string };
            driverName = driverData.name || 'Bilinmeyen Sürücü';
          }
        }

        const ride = {
          id: doc.id,
          driverId: rideData.driverId,
          driverName: driverName,
          status: rideData.status,
          pickup: rideData.pickupLocation,
          dropoffLocation: rideData.dropoffLocation,
          createdAt: rideData.createdAt,
          acceptedAt: rideData.acceptedAt,
          completedAt: rideData.completedAt,
          rating: rideData.rating,
          comment: rideData.comment
        };
        
        console.log('Processed Ride:', JSON.stringify(ride, null, 2));
        rides.push(ride);
      }

      // Tarihe göre sırala (en yeniden en eskiye)
      rides.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
      setRideHistory(rides);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const renderRideItem = ({ item }: { item: RideHistory }) => (
    <TouchableOpacity 
      style={styles.rideCard}
      onPress={() => router.push({
        pathname: '/ride-details',
        params: { rideId: item.id }
      })}
    >
      <View style={styles.rideHeader}>
        <View style={styles.driverInfo}>
          <IconSymbol name="person.fill" size={20} color="#3572EF" />
          <ThemedText style={styles.driverName}>{item.driverName}</ThemedText>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'completed' ? '#4CAF50' : '#FFA000' }
        ]}>
          <ThemedText style={styles.statusText}>
            {item.status === 'completed' ? 'Tamamlandı' : 'Kabul Edildi'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.rideDetails}>
        <View style={styles.locationInfo}>
          <IconSymbol name="location.fill" size={16} color="#666" />
          <ThemedText style={styles.locationText} numberOfLines={2}>
            {item.dropoffLocation?.display_name || 'Varış noktası belirtilmemiş'}
          </ThemedText>
        </View>
        
        <View style={styles.timeInfo}>
          <IconSymbol name="clock.fill" size={16} color="#666" />
          <ThemedText style={styles.timeText}>
            {new Date(item.createdAt.toDate()).toLocaleString('tr-TR')}
          </ThemedText>
        </View>

        {item.status === 'completed' && item.rating && (
          <View style={styles.ratingInfo}>
            <IconSymbol name="star.fill" size={16} color="#FFD700" />
            <ThemedText style={styles.ratingText}>
              {item.rating} / 5
            </ThemedText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <CustomHeader 
        title="Yolculuk Geçmişi"
        backgroundColor="#3572EF"
      />

      <FlatList
        data={rideHistory}
        renderItem={renderRideItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <IconSymbol name="car.fill" size={50} color="#ccc" />
            <ThemedText style={styles.emptyText}>
              Henüz yolculuk geçmişiniz bulunmuyor
            </ThemedText>
          </View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  rideCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rideDetails: {
    gap: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingText: {
    fontSize: 14,
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
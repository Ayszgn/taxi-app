import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { collection, query, where, getFirestore, onSnapshot, orderBy } from 'firebase/firestore';

type Ride = {
  id: string;
  passengerName: string;
  pickupLocation: {
    display_name?: string;
    address?: string;
  };
  dropoffLocation: {
    display_name?: string;
    address?: string;
  };
  status: string;
  fare: number;
  distance: string;
  duration: string;
  createdAt: any;
};

export default function RidesScreen() {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const db = getFirestore();
    const ridesRef = collection(db, 'rideRequests');
    
    // Sadece sürücünün sürüşlerini çek
    const q = query(
      ridesRef,
      where('driverId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ridesData: Ride[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        ridesData.push({
          id: doc.id,
          passengerName: data.passengerName || 'İsimsiz Yolcu',
          pickupLocation: {
            display_name: data.pickupLocation?.display_name,
            address: data.pickupLocation?.address
          },
          dropoffLocation: {
            display_name: data.dropoffLocation?.display_name,
            address: data.dropoffLocation?.address
          },
          status: data.status,
          fare: data.fare || 0,
          distance: data.distance || '0 km',
          duration: data.duration || '0 dk',
          createdAt: data.createdAt
        });
      });
      setRides(ridesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const renderRideItem = ({ item }: { item: Ride }) => (
    <View style={styles.rideCard}>
      <View style={styles.rideHeader}>
        <View style={styles.passengerInfo}>
          <IconSymbol name="person.fill" size={20} color="#3572EF" />
          <ThemedText style={styles.passengerName}>{item.passengerName}</ThemedText>
        </View>
        <View style={[
          styles.statusBadge,
          item.status === 'completed' && styles.completedBadge,
          item.status === 'cancelled' && styles.cancelledBadge,
          item.status === 'in_progress' && styles.inProgressBadge
        ]}>
          <ThemedText style={styles.statusText}>
            {item.status === 'completed' ? 'Tamamlandı' :
             item.status === 'cancelled' ? 'İptal Edildi' :
             item.status === 'in_progress' ? 'Devam Ediyor' : item.status}
          </ThemedText>
        </View>
      </View>

      <View style={styles.rideDetails}>
        <View style={styles.locationRow}>
          <IconSymbol name="mappin.circle.fill" size={16} color="#3572EF" />
          <ThemedText style={styles.locationText} numberOfLines={1}>
            {item.pickupLocation?.display_name || item.pickupLocation?.address || 'Alış noktası belirtilmemiş'}
          </ThemedText>
        </View>
        <View style={styles.locationRow}>
          <IconSymbol name="mappin.circle.fill" size={16} color="#C80036" />
          <ThemedText style={styles.locationText} numberOfLines={1}>
            {item.dropoffLocation?.display_name || item.dropoffLocation?.address || 'Bırakış noktası belirtilmemiş'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.rideFooter}>
        <View style={styles.rideInfo}>
          <ThemedText style={styles.rideInfoText}>{item.distance}</ThemedText>
          <ThemedText style={styles.rideInfoText}>{item.duration}</ThemedText>
        </View>
        <ThemedText style={styles.fareText}>{item.fare} TL</ThemedText>
      </View>

      <View style={styles.rideTime}>
        <IconSymbol name="clock.fill" size={14} color="#666" />
        <ThemedText style={styles.timeText}>
          {new Date(item.createdAt?.toDate?.() || item.createdAt).toLocaleString('tr-TR')}
        </ThemedText>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol name="car.fill" size={50} color="#ccc" />
      <ThemedText style={styles.emptyText}>
        Henüz sürüşünüz bulunmuyor.
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <CustomHeader 
        title="Sürüşlerim"
        backgroundColor="#3572EF"
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3572EF" />
        </View>
      ) : (
        <FlatList
          data={rides}
          renderItem={renderRideItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyList}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  rideCard: {
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
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedBadge: {
    backgroundColor: '#E8F5E9',
  },
  cancelledBadge: {
    backgroundColor: '#FFEBEE',
  },
  inProgressBadge: {
    backgroundColor: '#E3F2FD',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  rideDetails: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rideInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideInfoText: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  fareText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3572EF',
  },
  rideTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 
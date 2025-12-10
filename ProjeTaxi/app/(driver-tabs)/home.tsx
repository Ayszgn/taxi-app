import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Switch, View, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { doc, getDoc, getFirestore, updateDoc, collection, query, where, onSnapshot, serverTimestamp, getDocs } from 'firebase/firestore';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { db } from '@/config/firebase';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Driver } from '@/types/driver';
import { FlatList } from 'react-native';
import { useRouter } from 'expo-router';

type DriverDrawerParamList = {
  'complete-profile': undefined;
  home: undefined;
  rides: undefined;
  profile: undefined;
  settings: undefined;
  contact: undefined;
};

type DriverNavigationProp = DrawerNavigationProp<DriverDrawerParamList>;

interface RideRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  pickup: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
    display_name: string;
  };
  createdAt: any;
  acceptedAt?: any;
  startedAt?: any;
  dropoffLocation?: {
    display_name: string;
  };
  pickupLocation?: {
    latitude: number;
    longitude: number;
    display_name?: string;
  };
}

export default function DriverHomeScreen() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState<{[key: string]: string}>({});
  const navigation = useNavigation<DriverNavigationProp>();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [totalRides, setTotalRides] = useState(0);
  const router = useRouter();
  const [totalEarnings, setTotalEarnings] = useState(0);

  const checkProfileCompletion = async () => {
    if (!user) return;
    
    try {
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfileCompleted(data.profileCompleted || false);
        setIsOnline(data.isOnline || false);
      }
    } catch (error) {
      console.error('Profil durumu kontrol edilirken hata:', error);
      Alert.alert('Hata', 'Profil bilgileri alınırken bir hata oluştu.');
    }
  };

  // Sayfa her odaklandığında profil durumunu kontrol et
  useFocusEffect(
    React.useCallback(() => {
      checkProfileCompletion();
    }, [user])
  );

  // Çevrimiçi durumunu değiştirme fonksiyonu
  const handleOnlineStatusChange = async (newStatus: boolean) => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        isOnline: newStatus,
        lastStatusChange: new Date().toISOString()
      });
      
      setIsOnline(newStatus);
      
      Alert.alert(
        'Durum Güncellendi',
        newStatus ? 'Artık çevrimiçisiniz.' : 'Çevrimdışı duruma geçtiniz.'
      );
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
      Alert.alert('Hata', 'Durum güncellenirken bir hata oluştu.');
      setIsOnline(!newStatus); // Hata durumunda eski duruma geri dön
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Mevcut sürücünün bilgilerini çek
    const currentDriverRef = doc(db, 'users', user.uid);
    const unsubscribeCurrentDriver = onSnapshot(currentDriverRef, (doc) => {
      if (doc.exists()) {
        const driverData = doc.data();
        console.log('Sürücü verileri:', driverData);
        if (driverData.location?.coordinates) {
          setCurrentDriver({
            id: doc.id,
            name: driverData.name || '',
            phone: driverData.phone || '',
            vehiclePlate: driverData.vehiclePlate || '',
            location: {
              coordinates: {
                latitude: Number(driverData.location.coordinates.latitude),
                longitude: Number(driverData.location.coordinates.longitude),
              }
            },
            isOnline: driverData.isOnline || false
          });
        } else {
          console.log('Konum bilgisi bulunamadı');
        }
      } else {
        console.log('Sürücü dokümanı bulunamadı');
      }
    });

    // Diğer sürücülerin bilgilerini çek
    const driversRef = collection(db, 'users');
    const q = query(driversRef, where('isOnline', '==', true), where('role', '==', 'driver'));
    const unsubscribeDrivers = onSnapshot(q, (snapshot) => {
      const driversData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
        phone: doc.data().phone || '',
        vehiclePlate: doc.data().vehiclePlate || '',
        location: {
          coordinates: {
            latitude: Number(doc.data().location?.coordinates?.latitude) || 0,
            longitude: Number(doc.data().location?.coordinates?.longitude) || 0,
          }
        },
        isOnline: doc.data().isOnline || false
      })) as Driver[];
      setDrivers(driversData.filter(driver => driver.id !== user.uid));
    });

    return () => {
      unsubscribeCurrentDriver();
      unsubscribeDrivers();
    };
  }, [user]);

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

  // Sürüş taleplerini dinle
  useEffect(() => {
    if (!user) return;

    const db = getFirestore();
    const requestsRef = collection(db, 'rideRequests');
    const q = query(
      requestsRef,
      where('driverId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const requests: RideRequest[] = [];
      const newAddresses: {[key: string]: string} = {};

      for (const doc of snapshot.docs) {
        const requestData = doc.data();
        const request = { id: doc.id, ...requestData } as RideRequest;
        
        // Alış noktası için adres al
        if (request.pickupLocation?.latitude && request.pickupLocation?.longitude) {
          const address = await getAddressFromCoordinates(
            request.pickupLocation.latitude,
            request.pickupLocation.longitude
          );
          newAddresses[request.id] = address;
        }
        
        requests.push(request);
      }
      
      setAddresses(newAddresses);
      setRideRequests(requests);
    });

    return () => unsubscribe();
  }, [user]);

  // Toplam sürüş sayısını al
  useEffect(() => {
    if (!user?.uid) return;

    const db = getFirestore();
    const requestsRef = collection(db, 'rideRequests');
    const q = query(
      requestsRef,
      where('driverId', '==', user.uid),
      where('status', '==', 'completed')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTotalRides(snapshot.size);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Sürücünün toplam kazancını hesapla
  useEffect(() => {
    const calculateTotalEarnings = async () => {
      if (!user?.uid) return;

      try {
        setIsLoading(true);
        const db = getFirestore();
        const rideRequestsRef = collection(db, 'rideRequests');
        
        // Sürücünün tamamlanmış yolculuklarını getir
        const q = query(
          rideRequestsRef,
          where('driverId', '==', user.uid),
          where('status', '==', 'completed')
        );

        const querySnapshot = await getDocs(q);
        let total = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.fare) {
            total += Number(data.fare);
          }
        });

        console.log('Toplam kazanç:', total);
        setTotalEarnings(total);
      } catch (error) {
        console.error('Kazanç hesaplanırken hata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateTotalEarnings();
  }, [user?.uid]);

  const handleAcceptRide = async (request: RideRequest) => {
    try {
      const db = getFirestore();
      const rideRequestRef = doc(db, 'rideRequests', request.id);
      
      await updateDoc(rideRequestRef, {
        status: 'accepted',
        acceptedAt: new Date().toISOString()
      });

      // Yolculuk detayları sayfasına yönlendir
      router.push({
        pathname: '/ride-details',
        params: { rideRequestId: request.id }
      });
    } catch (error) {
      console.error('Sürüş kabul edilirken hata:', error);
      Alert.alert(
        'Hata',
        'Sürüş kabul edilirken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    }
  };

  const handleRejectRide = async (request: RideRequest) => {
    try {
      const db = getFirestore();
      const requestRef = doc(db, 'rideRequests', request.id);
      await updateDoc(requestRef, {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      Alert.alert('Bilgi', 'Sürüş talebi reddedildi.');
    } catch (error) {
      console.error('Talep reddedilirken hata:', error);
      Alert.alert('Hata', 'Talep reddedilirken bir hata oluştu.');
    }
  };

  const handleStartRide = async (request: RideRequest) => {
    try {
      const db = getFirestore();
      const requestRef = doc(db, 'rideRequests', request.id);
      await updateDoc(requestRef, {
        status: 'in_progress',
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      Alert.alert('Başarılı', 'Sürüş başlatıldı. İyi yolculuklar!');
    } catch (error) {
      console.error('Sürüş başlatılırken hata:', error);
      Alert.alert('Hata', 'Sürüş başlatılırken bir hata oluştu.');
    }
  };

  const renderRideRequest = (request: RideRequest) => (
    <View style={styles.requestCard} key={request.id}>
      <View style={styles.requestHeader}>
        <ThemedText style={styles.passengerName}>{request.passengerName}</ThemedText>
        <ThemedText style={styles.requestTime}>
          {new Date(request.createdAt?.toDate()).toLocaleTimeString()}
        </ThemedText>
      </View>
      <View style={styles.requestDetails}>
        <ThemedText style={styles.destination}>
          Alış: {addresses[request.id] || 'Adres yükleniyor...'}
        </ThemedText>
        <ThemedText style={styles.destination}>
          Varış: {request.dropoffLocation?.display_name || 'Varış noktası belirtilmemiş'}
        </ThemedText>
        {request.status === 'accepted' && (
          <ThemedText style={styles.acceptedTime}>
            Kabul: {new Date(request.acceptedAt?.toDate()).toLocaleTimeString()}
          </ThemedText>
        )}
      </View>
      <View style={styles.requestActions}>
        {request.status === 'accepted' ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.startRideButton]}
            onPress={() => handleStartRide(request)}
          >
            <ThemedText style={styles.actionButtonText}>Sürüşü Başlat</ThemedText>
          </TouchableOpacity>
        ) : request.status === 'pending' ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptRide(request)}
            >
              <ThemedText style={styles.actionButtonText}>Kabul Et</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectRide(request)}
            >
              <ThemedText style={styles.actionButtonText}>Reddet</ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <ThemedText style={styles.statusText}>
            {request.status === 'in_progress' ? 'Sürüş Devam Ediyor' : 
             request.status === 'completed' ? 'Sürüş Tamamlandı' :
             request.status === 'cancelled' ? 'Sürüş İptal Edildi' : 'Reddedildi'}
          </ThemedText>
        )}
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <CustomHeader 
        title={`Merhaba, ${user?.displayName || 'Sürücü'}`}
        rightIcon="bell.fill"
        onRightIconPress={() => {/* Bildirimler sayfasına yönlendirme */}}
        backgroundColor="#3572EF"
      />

      {!profileCompleted && (
        <TouchableOpacity 
          style={styles.warningContainer}
          onPress={() => navigation.navigate('complete-profile')}
        >
          <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#FFD700" />
          <View style={styles.warningTextContainer}>
            <ThemedText style={styles.warningTitle}>Hesabınızı Tamamlayın</ThemedText>
            <ThemedText style={styles.warningText}>
              Sürüş yapabilmek için lütfen hesap bilgilerinizi tamamlayın. Gerekli belgeleri yükleyin ve kişisel bilgilerinizi girin.
            </ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={20} color="#666" />
        </TouchableOpacity>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <ThemedText style={styles.statTitle}>Toplam Yolculuk</ThemedText>
          <ThemedText style={styles.statValue}>{totalRides}</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={styles.statTitle}>Toplam Kazanç</ThemedText>
          {isLoading ? (
            <ActivityIndicator size="small" color="#3572EF" />
          ) : (
            <ThemedText style={styles.statValue}>{totalEarnings} TL</ThemedText>
          )}
        </View>
      </View>

      <View style={styles.ridesHeader}>
        <ThemedText type="subtitle" style={{color:'#344CB7'}}>Sürüş Talepleri</ThemedText>
        <View style={styles.onlineStatusContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#0a7ea4" />
          ) : (
            <>
              <ThemedText style={{ fontSize: 12 }}>{isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</ThemedText>
              <Switch
                value={isOnline}
                onValueChange={handleOnlineStatusChange}
                disabled={isLoading}
              />
            </>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: currentDriver?.location?.coordinates?.latitude || 37.871540,
              longitude: currentDriver?.location?.coordinates?.longitude || 32.498914,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            {currentDriver && currentDriver.location?.coordinates && (
              <Marker
                coordinate={{
                  latitude: currentDriver.location.coordinates.latitude,
                  longitude: currentDriver.location.coordinates.longitude,
                }}
                title="Siz"
                description={`${currentDriver.vehiclePlate} - ${currentDriver.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}`}
                pinColor="blue"
              />
            )}

            {drivers.map((driver: Driver) => (
              driver.location?.coordinates && (
                <Marker
                  key={driver.id}
                  coordinate={{
                    latitude: driver.location.coordinates.latitude,
                    longitude: driver.location.coordinates.longitude,
                  }}
                  title={driver.name}
                  description={driver.vehiclePlate}
                  pinColor="red"
                />
              )
            ))}
          </MapView>
        </View>

        <View style={styles.requestsContainer}>
          <FlatList
            data={rideRequests}
            renderItem={({ item }: { item: RideRequest }) => renderRideRequest(item)}
            keyExtractor={(item: RideRequest) => item.id}
            ListEmptyComponent={() => (
              <View style={styles.emptyRequests}>
                <IconSymbol name="car.fill" size={50} color="#ccc" />
                <ThemedText style={styles.emptyText}>
                  Henüz sürüş talebi yok
                </ThemedText>
              </View>
            )}
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 5,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statCard: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
  },
  ridesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  onlineStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '50%',
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: 300,
  },
  requestsContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 8,
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestTime: {
    fontSize: 12,
    color: '#666',
  },
  requestDetails: {
    marginBottom: 12,
  },
  destination: {
    fontSize: 14,
    color: '#444',
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyRequests: {
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
  startRideButton: {
    backgroundColor: '#3572EF',
    flex: 1,
  },
  acceptedTime: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    flex: 1,
  },
  statTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3572EF',
  },
});
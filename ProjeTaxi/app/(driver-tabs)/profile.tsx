import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { doc, getDoc, getFirestore, collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

type DriverDrawerParamList = {
  'complete-profile': undefined;
  home: undefined;
  rides: undefined;
  profile: undefined;
  settings: undefined;
  contact: undefined;
};

type DriverNavigationProp = DrawerNavigationProp<DriverDrawerParamList>;

export default function DriverProfileScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<DriverNavigationProp>();
  const [userData, setUserData] = useState<any>(null);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [totalRides, setTotalRides] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setProfileCompleted(data.profileCompleted || false);
          }
        } catch (error) {
          console.error('Kullanıcı bilgileri yüklenirken hata:', error);
        }
      }
    };

    fetchUserData();
  }, [user]);

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

  useEffect(() => {
    const calculateTotalEarningsAndDistance = async () => {
      if (!user?.uid) return;

      try {
        setIsLoading(true);
        const db = getFirestore();
        const rideRequestsRef = collection(db, 'rideRequests');
        
        const q = query(
          rideRequestsRef,
          where('driverId', '==', user.uid),
          where('status', '==', 'completed')
        );

        const querySnapshot = await getDocs(q);
        let totalEarnings = 0;
        let totalDistance = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.fare) {
            totalEarnings += Number(data.fare);
          }
          if (data.distance) {
            // Mesafe string'den sayıya çevirme (örn: "5.2 km" -> 5.2)
            const distanceStr = data.distance.replace(' km', '');
            totalDistance += Number(distanceStr);
          }
        });

        console.log('Toplam kazanç:', totalEarnings);
        console.log('Toplam mesafe:', totalDistance);
        setTotalEarnings(totalEarnings);
        setTotalDistance(totalDistance);
      } catch (error) {
        console.error('Hesaplama yapılırken hata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateTotalEarningsAndDistance();
  }, [user?.uid]);

  const handleCompleteProfile = () => {
    navigation.navigate('complete-profile');
  };

  return (
    <ThemedView style={styles.container}>
      <CustomHeader 
        title="Profilim"
        rightIcon="square.and.pencil"
        onRightIconPress={() => {/* Profil düzenleme sayfasına yönlendirme */}}
        backgroundColor="#3572EF"
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: userData?.profilePhoto || user?.photoURL || 'https://via.placeholder.com/150' }} 
            style={styles.profileImage} 
          />
          <ThemedText style={styles.name}>{user?.displayName || 'Sürücü'}</ThemedText>
          <ThemedText style={styles.email}>{user?.email}</ThemedText>
          
          {profileCompleted ? (
            <View style={styles.ratingContainer}>
              <IconSymbol name="star.fill" size={20} color="#FFD700" />
              <ThemedText style={styles.rating}>_._</ThemedText>
              <ThemedText style={styles.ratingCount}>(_ değerlendirme)</ThemedText>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.completeProfileButton}
              onPress={handleCompleteProfile}
            >
              <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#FFD700" />
              <ThemedText style={styles.completeProfileText}>Hesabı Tamamla</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Kişisel Bilgiler</ThemedText>
          
          <View style={styles.infoItem}>
            <IconSymbol name="phone.fill" size={20} color="#344CB7" />
            <ThemedText style={styles.infoText}>Tel No:
              {profileCompleted ? userData?.phone || 'Belirtilmemiş' : '---'}
            </ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <IconSymbol name="person.text.rectangle.fill" size={20} color="#344CB7" />
            <ThemedText style={styles.infoText}>TC No:
              {profileCompleted ? userData?.tcKimlik || 'Belirtilmemiş' : '---'}
            </ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <IconSymbol name="calendar" size={20} color="#344CB7" />
            <ThemedText style={styles.infoText}>Doğum Tarihi:
              {profileCompleted && userData?.birthDate 
                ? new Date(userData.birthDate.seconds * 1000).toLocaleDateString('tr-TR') 
                : '---'}
            </ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <IconSymbol name="location.fill" size={20} color="#344CB7" />
            <ThemedText style={styles.infoText}>Adres:
              {profileCompleted ? userData?.address || 'Belirtilmemiş' : '---'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Sürüş İstatistikleri</ThemedText>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {totalRides}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Toplam Sürüş</ThemedText>
            </View>
            
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#3572EF" />
                ) : (
                  `${totalDistance.toFixed(1)} km`
                )}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Toplam Mesafe</ThemedText>
            </View>
            
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#3572EF" />
                ) : (
                  `₺${totalEarnings.toFixed(2)}`
                )}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Toplam Kazanç</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Araç Bilgileri</ThemedText>
          
          <View style={styles.infoItem}>
            <IconSymbol name="car.fill" size={20} color="#344CB7" />
            <ThemedText style={styles.infoText}>Plaka:
              {profileCompleted ? userData?.vehiclePlate || 'Belirtilmemiş' : '---'}
            </ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <IconSymbol name="car.circle.fill" size={20} color="#344CB7" />
            <ThemedText style={styles.infoText}>Araç Modeli:
              {profileCompleted ? userData?.carModel || 'Belirtilmemiş' : '---'}
            </ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <IconSymbol name="doc.text.fill" size={20} color="#344CB7" />
            <ThemedText style={styles.infoText}>
              {profileCompleted ? 'Sürücü Belgesi: Yüklendi' : '---'}
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  rating: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  ratingCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  completeProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 10,
  },
  completeProfileText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginLeft: 5,
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#344CB7',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C80036',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
}); 
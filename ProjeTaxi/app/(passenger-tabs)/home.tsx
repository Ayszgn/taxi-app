import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, TextInput, FlatList, Modal, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconSymbol } from '@/components/ui/IconSymbol';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Button } from '@rneui/themed';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getFirestore, collection, query, where, onSnapshot, doc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { Text as RNText } from 'react-native';

type RootStackParamList = {
  Home: { selectedLocation?: { latitude: number; longitude: number; display_name: string } };
  SelectDriver: { destination: { display_name: string; lat: number; lon: number } };
  LocationSearch: undefined;
};

type HomeRouteProp = RouteProp<RootStackParamList, 'Home'>;

// Tip tanımlamaları
interface Driver {
  id: string;
  name: string;
  vehiclePlate: string;
  location: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  isOnline: boolean;
}

// Konya merkez koordinatları
const KONYA_CENTER = {
  latitude: 37.8719,
  longitude: 32.4843,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function HomeScreen() {
  const route = useRoute<HomeRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    display_name: string;
  } | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{
    display_name: string;
    lat: string;
    lon: string;
    place_id: number;
  }>>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [passengerLocation, setPassengerLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const { user } = useAuth();
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  // Telefon doğrulama durumunu kontrol et
  useEffect(() => {
    const checkPhoneVerification = async () => {
      if (user) {
        const db = getFirestore();
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsPhoneVerified(userData.phoneVerified || false);
          setPhoneNumber(userData.phoneNumber || '');
          setShowPhoneInput(!userData.phoneVerified);
        }
      }
    };

    checkPhoneVerification();
  }, [user]);

  // Yolcu konum bilgisini veritabanından al
  useEffect(() => {
    if (!user?.uid) return;

    const db = getFirestore();
    const userRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(userRef, (doc) => {
      const data = doc.data();
      console.log('Veritabanından alınan yolcu verisi:', data);
      if (data?.location?.coordinates) {
        console.log('Yolcu konum bilgisi:', data.location.coordinates);
        setPassengerLocation({
          latitude: data.location.coordinates.latitude,
          longitude: data.location.coordinates.longitude
        });
      } else {
        console.log('Yolcu konum bilgisi bulunamadı');
        // Konum bilgisi bulunamadığında null olarak bırak
        setPassengerLocation(null);
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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Sürücü sayısı:', snapshot.size);
      const driversData: Driver[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Sürücü verisi:', data);
        if (data.location?.coordinates) {
          const latitude = Number(data.location.coordinates.latitude);
          const longitude = Number(data.location.coordinates.longitude);
          
          if (!isNaN(latitude) && !isNaN(longitude)) {
            driversData.push({
              id: doc.id,
              name: data.name || 'Sürücü',
              vehiclePlate: data.vehiclePlate || 'Plaka Yok',
              location: {
                coordinates: {
                  latitude,
                  longitude,
                }
              },
              isOnline: data.isOnline || false
            });
          } else {
            console.log('Geçersiz koordinatlar:', doc.id, data.location.coordinates);
          }
        } else {
          console.log('Konum bilgisi eksik:', doc.id);
        }
      });
      console.log('Haritaya eklenecek sürücü sayısı:', driversData.length);
      setDrivers(driversData);
    }, (error) => {
      console.error('Sürücü verileri alınırken hata:', error);
    });

    return () => unsubscribe();
  }, []);

  // Seçilen konumu route params'dan al
  useEffect(() => {
    if (route.params?.selectedLocation) {
      setSelectedLocation(route.params.selectedLocation);
    }
  }, [route.params]);

  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=tr`,
        {
          headers: {
            'Accept': 'application/json',
            'Accept-Language': 'tr',
            'User-Agent': 'TaxiApp/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('API yanıt vermedi');
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Konum arama hatası:', error);
      setSearchResults([]);
    }
  };

  const handleLocationSelect = (item: { display_name: string; lat: string; lon: string }) => {
    setSelectedLocation({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      display_name: item.display_name
    });
    setShowSearchModal(false);
    setSearchText('');
  };

  const handleConfirmLocation = async () => {
    if (selectedLocation) {
      try {
        // Sadece varış noktasını SelectDriver sayfasına gönder
        navigation.navigate('SelectDriver', {
          destination: {
            display_name: selectedLocation.display_name,
            lat: selectedLocation.latitude,
            lon: selectedLocation.longitude
          }
        });
      } catch (error) {
        console.error('Konum güncellenirken hata:', error);
        Alert.alert('Hata', 'Konum bilgisi güncellenirken bir hata oluştu.');
      }
    }
  };

  const handleClearLocation = () => {
    setSelectedLocation(null);
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Hata', 'Lütfen geçerli bir telefon numarası girin.');
      return;
    }

    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', user?.uid || '');
      
      await updateDoc(userRef, {
        phoneNumber: phoneNumber,
        phoneVerified: true
      });

      setIsPhoneVerified(true);
      setShowPhoneInput(false);
      Alert.alert('Başarılı', 'Telefon numaranız başarıyla kaydedildi.');
    } catch (error) {
      console.error('Telefon numarası kaydedilirken hata:', error);
      Alert.alert('Hata', 'Telefon numarası kaydedilirken bir hata oluştu.');
    }
  };

  if (showPhoneInput) {
    return (
      <ThemedView style={styles.container}>
        <CustomHeader title="Hesap Onayı" backgroundColor="#3572EF" />
        <View style={styles.phoneVerificationContainer}>
          <ThemedText style={styles.phoneVerificationTitle}>
            Hesabınızı Onaylayın
          </ThemedText>
          <ThemedText style={styles.phoneVerificationText}>
            Devam etmek için lütfen telefon numaranızı girin.
          </ThemedText>
          
          <TextInput
            style={styles.phoneInput}
            placeholder="Telefon Numarası (5XX XXX XX XX)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={10}
          />
          
          <TouchableOpacity 
            style={styles.verifyButton}
            onPress={handlePhoneSubmit}
          >
            <ThemedText style={styles.verifyButtonText}>
              Onayla
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {!isPhoneVerified && (
        <View style={styles.warningContainer}>
          <ThemedText style={styles.warningText}>
            Hesabınızı onaylamak için telefon numaranızı kaydedin.
          </ThemedText>
          <TouchableOpacity 
            style={styles.warningButton}
            onPress={() => setShowPhoneInput(true)}
          >
            <ThemedText style={styles.warningButtonText}>
              Şimdi Onayla
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
      <CustomHeader 
        title="Ana Sayfa" 
        backgroundColor="#3572EF"
      />
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <TouchableOpacity 
            style={styles.searchBox}
            onPress={() => setShowSearchModal(true)}
          >
            <IconSymbol name="magnifyingglass" size={24} color="#666" />
            <ThemedText style={styles.searchText}>
              {selectedLocation ? selectedLocation.display_name : 'Nereye gitmek istersiniz?'}
            </ThemedText>
          </TouchableOpacity>
          
          {selectedLocation && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={handleClearLocation}
            >
              <View style={styles.clearButtonInner}>
                <MaterialIcons name="close" size={20} color="#C80036" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        <Modal
          visible={showSearchModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSearchModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.searchInputContainer}>
                <IconSymbol name="magnifyingglass" size={24} color="#666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Nereye gitmek istersiniz?"
                  value={searchText}
                  onChangeText={(text) => {
                    setSearchText(text);
                    searchLocations(text);
                  }}
                  autoFocus={true}
                />
                <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                  <IconSymbol name="xmark" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.place_id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={() => handleLocationSelect(item)}
                  >
                    <IconSymbol name="mappin" size={24} color="#666" />
                    <ThemedText style={styles.searchResultText}>{item.display_name}</ThemedText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={KONYA_CENTER}
          region={
            selectedLocation
              ? {
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }
              : undefined
          }
        >
          {/* Seçilen konum */}
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              title="Hedef"
              pinColor="#C80036"
            />
          )}

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

          {/* Çevrimiçi sürücüler */}
          {drivers.map((driver) => (
            <Marker
              key={driver.id}
              coordinate={{
                latitude: driver.location.coordinates.latitude,
                longitude: driver.location.coordinates.longitude,
              }}
              title={driver.name}
              description={driver.vehiclePlate}
              pinColor="#FFA500"
            />
          ))}
        </MapView>

        {/* Sürücü seç butonu */}
        {selectedLocation && (
          <View style={styles.confirmButtonContainer}>
            <Button
              title="Sürücü Seç"
              onPress={handleConfirmLocation}
              buttonStyle={styles.confirmButton}
            />
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  searchContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchText: {
    marginLeft: 10,
    flex: 1,
    color: '#666',
  },
  clearButton: {
    marginLeft: 10,
  },
  clearButtonInner: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
    padding: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
    fontSize: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultText: {
    marginLeft: 10,
    flex: 1,
  },
  map: {
    flex: 1,
  },
  confirmButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  confirmButton: {
    backgroundColor: '#3572EF',
    borderRadius: 8,
    paddingVertical: 15,
  },
  phoneVerificationContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneVerificationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  phoneVerificationText: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
  },
  phoneInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  verifyButton: {
    backgroundColor: '#3572EF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeeba',
  },
  warningText: {
    color: '#856404',
    marginBottom: 10,
  },
  warningButton: {
    backgroundColor: '#3572EF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  warningButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 
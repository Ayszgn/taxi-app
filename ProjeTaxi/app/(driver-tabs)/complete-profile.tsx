import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Alert, Image, Platform, Modal } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function CompleteProfileScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [formData, setFormData] = useState({
    phone: '',
    tcKimlik: '',
    birthDate: new Date(),
    address: '',
    vehiclePlate: '',
    carModel: '',
    driverLicense: null,
    vehicleRegistration: null
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({
    driverLicense: null,
    vehicleRegistration: null
  });

  // Tarih seçici için gerekli state'ler
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 18);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  // Ay isimleri
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  // Yıl listesi (18 yaşından 80 yaşına kadar)
  const years = Array.from({ length: 63 }, (_, i) => new Date().getFullYear() - 18 - i);
  
  // Ay listesi
  const monthList = Array.from({ length: 12 }, (_, i) => i);
  
  // Gün listesi
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const days = Array.from(
    { length: getDaysInMonth(selectedYear, selectedMonth) },
    (_, i) => i + 1
  );

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            
            // Eğer kullanıcının doğum tarihi varsa, state'leri güncelle
            if (data.birthDate) {
              const birthDate = new Date(data.birthDate);
              setSelectedYear(birthDate.getFullYear());
              setSelectedMonth(birthDate.getMonth());
              setSelectedDay(birthDate.getDate());
            }
            
            setFormData({
              phone: data.phone || '',
              tcKimlik: data.tcKimlik || '',
              birthDate: data.birthDate ? new Date(data.birthDate) : new Date(),
              address: data.address || '',
              vehiclePlate: data.vehiclePlate || '',
              carModel: data.carModel || '',
              driverLicense: data.driverLicense || null,
              vehicleRegistration: data.vehicleRegistration || null,
            });
            setUploadedFiles({
              driverLicense: data.driverLicense || null,
              vehicleRegistration: data.vehicleRegistration || null
            });
          }
        } catch (error) {
          console.error('Kullanıcı bilgileri yüklenirken hata:', error);
          Alert.alert('Hata', 'Kullanıcı bilgileri yüklenirken bir hata oluştu.');
        }
      }
    };

    fetchUserData();
  }, [user]);

  const pickDocument = async (type: 'driverLicense' | 'vehicleRegistration') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      const fileUri = file.uri;
      
      try {
        // Uygulama belgeler dizinini oluştur
        const documentsDir = FileSystem.documentDirectory + 'driver_documents/';
        const dirInfo = await FileSystem.getInfoAsync(documentsDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true });
        }

        // Dosya adını oluştur
        const fileExtension = fileUri.split('.').pop();
        const fileName = `${type}_${Date.now()}.${fileExtension}`;
        const destinationUri = documentsDir + fileName;

        // Dosyayı kopyala
        await FileSystem.copyAsync({
          from: fileUri,
          to: destinationUri
        });

        // State'i güncelle
        setUploadedFiles(prev => ({ ...prev, [type]: destinationUri }));
        Alert.alert('Başarılı', 'Belge başarıyla kaydedildi.');
      } catch (error) {
        console.error('Belge kopyalama hatası:', error);
        Alert.alert('Hata', 'Belge kaydedilemedi. Lütfen daha sonra tekrar deneyin.');
      }
    } catch (error) {
      console.error('Belge seçilirken hata:', error);
      Alert.alert('Hata', 'Belge seçilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  };

  const handleDateConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    setFormData(prev => ({ ...prev, birthDate: newDate }));
    setShowDatePicker(false);
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!user) return;

    // Form validasyonu
    if (!formData.phone || !formData.tcKimlik || !formData.birthDate || 
        !formData.address || !formData.vehiclePlate || !formData.carModel || 
        !uploadedFiles.driverLicense || !uploadedFiles.vehicleRegistration) {
      Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun ve gerekli belgeleri yükleyin.');
      return;
    }

    setLoading(true);

    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);

      // Kullanıcı verilerini güncelle
      await updateDoc(userRef, {
        phone: formData.phone,
        tcKimlik: formData.tcKimlik,
        birthDate: formData.birthDate,
        address: formData.address,
        vehiclePlate: formData.vehiclePlate,
        carModel: formData.carModel,
        driverLicense: uploadedFiles.driverLicense,
        vehicleRegistration: uploadedFiles.vehicleRegistration,
        profileCompleted: true,
        isOnline: false,
        role: 'driver',
        updatedAt: new Date().toISOString()
      });

      Alert.alert(
        'Başarılı',
        'Profiliniz başarıyla tamamlandı. Artık çevrimiçi olabilir ve yolcu isteklerini kabul edebilirsiniz.',
        [
          {
            text: 'Tamam',
            onPress: () => {
              router.push('/(driver-tabs)/home');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <CustomHeader 
        title="Hesabı Tamamla" 
        backgroundColor="#3572EF"
      />

      <ScrollView style={styles.content}>
        <ThemedText style={styles.sectionTitle}>Kişisel Bilgiler</ThemedText>
        
        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Telefon Numarası *</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
            placeholder="Telefon numaranızı girin"
            keyboardType="phone-pad"
          />
        </View>
        
        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>T.C. Kimlik Numarası *</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.tcKimlik}
            onChangeText={(text) => setFormData(prev => ({ ...prev, tcKimlik: text }))}
            placeholder="T.C. Kimlik numaranızı girin"
            keyboardType="numeric"
            maxLength={11}
          />
        </View>
        
        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Doğum Tarihi *</ThemedText>
          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <ThemedText>
              {`${selectedDay} ${months[selectedMonth]} ${selectedYear}`}
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Adres *</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.address}
            onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
            placeholder="Adresinizi girin"
            multiline
            numberOfLines={3}
          />
        </View>
        
        <ThemedText style={styles.sectionTitle}>Araç Bilgileri</ThemedText>
        
        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Araç Modeli *</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.carModel}
            onChangeText={(text) => setFormData(prev => ({ ...prev, carModel: text }))}
            placeholder="Araç modelinizi girin"
          />
        </View>
        
        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Araç Plakası *</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.vehiclePlate}
            onChangeText={(text) => setFormData(prev => ({ ...prev, vehiclePlate: text.toUpperCase() }))}
            placeholder="Araç plakanızı girin"
            autoCapitalize="characters"
          />
        </View>
        
        <ThemedText style={styles.sectionTitle}>Belgeler</ThemedText>
        
        <View style={styles.documentSection}>
          <ThemedText style={styles.label}>Ehliyet *</ThemedText>
          <TouchableOpacity 
            style={styles.documentButton}
            onPress={() => pickDocument('driverLicense')}
          >
            {uploadedFiles.driverLicense ? (
              <Image 
                source={{ uri: uploadedFiles.driverLicense }} 
                style={styles.documentPreview} 
              />
            ) : (
              <View style={styles.documentPlaceholder}>
                <IconSymbol name="doc.fill" size={24} color="#666" />
                <ThemedText style={styles.documentText}>Ehliyet Yükle</ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.documentSection}>
          <ThemedText style={styles.label}>Ruhsat *</ThemedText>
          <TouchableOpacity 
            style={styles.documentButton}
            onPress={() => pickDocument('vehicleRegistration')}
          >
            {uploadedFiles.vehicleRegistration ? (
              <Image 
                source={{ uri: uploadedFiles.vehicleRegistration }} 
                style={styles.documentPreview} 
              />
            ) : (
              <View style={styles.documentPlaceholder}>
                <IconSymbol name="doc.fill" size={24} color="#666" />
                <ThemedText style={styles.documentText}>Ruhsat Yükle</ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ThemedText style={styles.submitButtonText}>Kaydediliyor...</ThemedText>
          ) : (
            <ThemedText style={styles.submitButtonText}>Kaydet</ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.datePickerHeader}>
              <ThemedText style={styles.modalTitle}>Doğum Tarihi Seçin</ThemedText>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <IconSymbol name="xmark" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContainer}>
              <View style={styles.pickerColumn}>
                <ThemedText style={styles.pickerLabel}>Gün</ThemedText>
                <ScrollView style={styles.pickerScrollView}>
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        selectedDay === day && styles.selectedPickerItem
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <ThemedText
                        style={[
                          styles.pickerItemText,
                          selectedDay === day && styles.selectedPickerItemText
                        ]}
                      >
                        {day}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.pickerColumn}>
                <ThemedText style={styles.pickerLabel}>Ay</ThemedText>
                <ScrollView style={styles.pickerScrollView}>
                  {monthList.map((monthIndex) => (
                    <TouchableOpacity
                      key={monthIndex}
                      style={[
                        styles.pickerItem,
                        selectedMonth === monthIndex && styles.selectedPickerItem
                      ]}
                      onPress={() => setSelectedMonth(monthIndex)}
                    >
                      <ThemedText
                        style={[
                          styles.pickerItemText,
                          selectedMonth === monthIndex && styles.selectedPickerItemText
                        ]}
                      >
                        {months[monthIndex]}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.pickerColumn}>
                <ThemedText style={styles.pickerLabel}>Yıl</ThemedText>
                <ScrollView style={styles.pickerScrollView}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && styles.selectedPickerItem
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <ThemedText
                        style={[
                          styles.pickerItemText,
                          selectedYear === year && styles.selectedPickerItemText
                        ]}
                      >
                        {year}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleDateConfirm}
            >
              <ThemedText style={styles.confirmButtonText}>Onayla</ThemedText>
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
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#3572EF',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  documentSection: {
    marginBottom: 20,
  },
  documentButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    height: 150,
  },
  documentPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  documentText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  documentPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  submitButton: {
    backgroundColor: '#3572EF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  pickerScrollView: {
    maxHeight: 200,
  },
  pickerItem: {
    padding: 10,
    width: '100%',
    alignItems: 'center',
  },
  selectedPickerItem: {
    backgroundColor: '#3572EF',
    borderRadius: 5,
  },
  pickerItemText: {
    fontSize: 16,
  },
  selectedPickerItemText: {
    color: 'white',
  },
  confirmButton: {
    backgroundColor: '#3572EF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { useAuth } from '@/context/AuthContext';
import { doc, getFirestore, getDoc, updateDoc } from 'firebase/firestore';
import { IconSymbol } from '@/components/ui/IconSymbol';

const languages = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'ar', name: 'العربية' }
];

export default function LanguageSettingsScreen() {
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState('tr');

  useEffect(() => {
    const fetchLanguage = async () => {
      if (user) {
        try {
          const db = getFirestore();
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.language) {
              setSelectedLanguage(data.language);
            }
          }
        } catch (error) {
          console.error('Dil ayarı alınırken hata:', error);
        }
      }
    };

    fetchLanguage();
  }, [user]);

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', user?.uid || '');
      
      await updateDoc(userRef, {
        language: languageCode
      });

      setSelectedLanguage(languageCode);
      Alert.alert('Başarılı', 'Dil ayarı güncellendi. Değişikliklerin etkili olması için uygulamayı yeniden başlatın.');
    } catch (error) {
      console.error('Dil ayarı güncellenirken hata:', error);
      Alert.alert('Hata', 'Dil ayarı güncellenirken bir hata oluştu.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <CustomHeader 
        title="Dil Seçimi" 
        backgroundColor="#3572EF"
        showBackButton={true}
      />
      
      <View style={styles.content}>
        {languages.map((language) => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageItem,
              selectedLanguage === language.code && styles.selectedLanguage
            ]}
            onPress={() => handleLanguageSelect(language.code)}
          >
            <ThemedText style={styles.languageText}>{language.name}</ThemedText>
            {selectedLanguage === language.code && (
              <IconSymbol name="checkmark" size={24} color="#3572EF" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedLanguage: {
    backgroundColor: '#f5f5f5',
  },
  languageText: {
    fontSize: 16,
  },
}); 
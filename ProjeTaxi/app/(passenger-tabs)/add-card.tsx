import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { useAuth } from '@/context/AuthContext';
import { doc, getFirestore, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

export default function AddCardScreen() {
  const { user } = useAuth();
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleAddCard = async () => {
    if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (cardNumber.replace(/\s/g, '').length !== 16) {
      Alert.alert('Hata', 'Geçerli bir kart numarası girin.');
      return;
    }

    if (cvv.length !== 3) {
      Alert.alert('Hata', 'Geçerli bir CVV girin.');
      return;
    }

    setLoading(true);

    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', user?.uid || '');
      
      // Önce mevcut kartları al
      const userDoc = await getDoc(userRef);
      const currentCards = userDoc.exists() ? (userDoc.data().cards || []) : [];
      
      const newCard = {
        id: Date.now().toString(),
        cardNumber: cardNumber.replace(/\s/g, '').slice(-4),
        cardHolder: cardHolder.toUpperCase(),
        expiryDate: expiryDate,
        isDefault: currentCards.length === 0 // İlk kart ise varsayılan yap
      };

      // Tüm kartları güncelle
      await updateDoc(userRef, {
        cards: [...currentCards, newCard]
      });

      Alert.alert('Başarılı', 'Kartınız başarıyla eklendi.', [
        {
          text: 'Tamam',
          onPress: () => router.replace('/(passenger-tabs)/cards')
        }
      ]);
      
      // Formu temizle
      setCardNumber('');
      setCardHolder('');
      setExpiryDate('');
      setCvv('');
    } catch (error) {
      console.error('Kart eklenirken hata:', error);
      Alert.alert('Hata', 'Kart eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <CustomHeader title="Yeni Kart Ekle" backgroundColor="#3572EF" />
      
      <ScrollView style={styles.content}>
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol name="creditcard.fill" size={40} color="white" />
            </View>
            
            <View style={styles.cardNumberContainer}>
              <ThemedText style={styles.cardNumber}>
                {cardNumber || '**** **** **** ****'}
              </ThemedText>
            </View>
            
            <View style={styles.cardDetails}>
              <View>
                <ThemedText style={styles.cardLabel}>Kart Sahibi</ThemedText>
                <ThemedText style={styles.cardValue}>
                  {cardHolder || 'AD SOYAD'}
                </ThemedText>
              </View>
              
              <View>
                <ThemedText style={styles.cardLabel}>Son Kullanma</ThemedText>
                <ThemedText style={styles.cardValue}>
                  {expiryDate || 'MM/YY'}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Kart Numarası</ThemedText>
            <TextInput
              style={styles.input}
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              placeholder="1234 5678 9012 3456"
              keyboardType="numeric"
              maxLength={19}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Kart Sahibi</ThemedText>
            <TextInput
              style={styles.input}
              value={cardHolder}
              onChangeText={setCardHolder}
              placeholder="AD SOYAD"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <ThemedText style={styles.label}>Son Kullanma Tarihi</ThemedText>
              <TextInput
                style={styles.input}
                value={expiryDate}
                onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                placeholder="MM/YY"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1 }]}>
              <ThemedText style={styles.label}>CVV</ThemedText>
              <TextInput
                style={styles.input}
                value={cvv}
                onChangeText={setCvv}
                placeholder="123"
                keyboardType="numeric"
                maxLength={3}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAddCard}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>
              {loading ? 'Ekleniyor...' : 'Kartı Ekle'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  cardContainer: {
    padding: 20,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    height: 200,
    backgroundColor: '#3572EF',
    borderRadius: 15,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cardNumberContainer: {
    alignItems: 'center',
  },
  cardNumber: {
    color: 'white',
    fontSize: 24,
    letterSpacing: 2,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
  cardValue: {
    color: 'white',
    fontSize: 16,
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
  },
  button: {
    backgroundColor: '#3572EF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
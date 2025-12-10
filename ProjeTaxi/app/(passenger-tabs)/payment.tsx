import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { doc, getFirestore, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';

interface Card {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  isDefault: boolean;
}

export default function PaymentScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId: string }>();
  const [defaultCard, setDefaultCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [driverInfo, setDriverInfo] = useState<{ name: string; id: string } | null>(null);

  useEffect(() => {
    if (!params.rideId) {
      Alert.alert('Hata', 'Yolculuk bilgisi bulunamadı.');
      router.back();
      return;
    }
    fetchCardAndPaymentDetails();
  }, [params.rideId]);

  const fetchCardAndPaymentDetails = async () => {
    try {
      const db = getFirestore();
      
      // Yolculuk detaylarını al
      const rideRef = doc(db, 'rideRequests', params.rideId);
      const rideDoc = await getDoc(rideRef);

      if (!rideDoc.exists()) {
        console.error('Yolculuk dökümanı bulunamadı:', params.rideId);
        Alert.alert('Hata', 'Yolculuk bilgileri bulunamadı.');
        router.back();
        return;
      }

      const rideData = rideDoc.data();
      console.log('Yolculuk verileri:', rideData);
      setPaymentAmount(rideData.fare || 0);
      
      // Sürücü bilgilerini al
      if (rideData.driver) {
        setDriverInfo({
          name: rideData.driver.name,
          id: rideData.driver.id
        });
      }

      // Varsayılan kartı al
      const userRef = doc(db, 'users', user?.uid || '');
      console.log('Kullanıcı ID:', user?.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('Kullanıcı verileri:', userData);
        const cards = userData.cards || [];
        console.log('Kullanıcının kartları:', cards);
        const defaultCard = cards.find((card: Card) => card.isDefault);
        console.log('Varsayılan kart:', defaultCard);
        setDefaultCard(defaultCard || null);
      } else {
        console.error('Kullanıcı dökümanı bulunamadı:', user?.uid);
      }

    } catch (error) {
      console.error('Bilgiler alınırken hata:', error);
      Alert.alert('Hata', 'Bilgiler alınırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      const db = getFirestore();
      const rideRef = doc(db, 'rideRequests', params.rideId);

      await updateDoc(rideRef, {
        status: 'completed',
        paymentMethod: 'card',
        completedAt: Date.now()
      });

      // Direkt ana sayfaya yönlendir
      router.replace('/home');
      
    } catch (error) {
      console.error('Ödeme yapılırken hata:', error);
      Alert.alert('Hata', 'Ödeme yapılırken bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <CustomHeader title="Ödeme" backgroundColor="#3572EF" />
        <View style={styles.loadingContainer}>
          <ThemedText>Yükleniyor...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!defaultCard) {
    return (
      <ThemedView style={styles.container}>
        <CustomHeader title="Ödeme" backgroundColor="#3572EF" />
        <View style={styles.errorContainer}>
          <IconSymbol name="creditcard" size={64} color="#666" />
          <ThemedText style={styles.errorTitle}>Kayıtlı Kart Bulunamadı</ThemedText>
          <ThemedText style={styles.errorMessage}>
            Ödeme yapabilmek için lütfen bir kart ekleyin.
          </ThemedText>
          <TouchableOpacity
            style={styles.addCardButton}
            onPress={() => router.push('/(passenger-tabs)/add-card')}
          >
            <ThemedText style={styles.addCardButtonText}>
              Kart Ekle
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <CustomHeader title="Ödeme" backgroundColor="#3572EF" />
      
      <View style={styles.content}>
        <View style={styles.cardContainer}>
          <ThemedText style={styles.sectionTitle}>Ödeme Yapılan Kart</ThemedText>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol name="creditcard.fill" size={40} color="white" />
              <View style={styles.defaultBadge}>
                <ThemedText style={styles.defaultText}>Varsayılan</ThemedText>
              </View>
            </View>
            
            <View style={styles.cardNumberContainer}>
              <ThemedText style={styles.cardNumber}>
                **** **** **** {defaultCard.cardNumber}
              </ThemedText>
            </View>
            
            <View style={styles.cardDetails}>
              <View>
                <ThemedText style={styles.cardLabel}>Kart Sahibi</ThemedText>
                <ThemedText style={styles.cardValue}>
                  {defaultCard.cardHolder}
                </ThemedText>
              </View>
              
              <View>
                <ThemedText style={styles.cardLabel}>Son Kullanma</ThemedText>
                <ThemedText style={styles.cardValue}>
                  {defaultCard.expiryDate}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.paymentInfoContainer}>
          <View style={styles.paymentAmountContainer}>
            <ThemedText style={styles.paymentLabel}>Ödenen Tutar</ThemedText>
            <ThemedText style={styles.paymentAmount}>
              {paymentAmount.toFixed(2)} ₺
            </ThemedText>
          </View>

          <View style={styles.paymentStatusContainer}>
            <IconSymbol name="checkmark.circle.fill" size={24} color="#4CAF50" />
            <ThemedText style={styles.paymentStatusText}>
              Ödeme Tamamlandı
            </ThemedText>
          </View>
        </View>

        <View style={styles.ratingContainer}>
          <ThemedText style={styles.ratingTitle}>Sürücüyü Değerlendir</ThemedText>
          
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <MaterialIcons
                  name={star <= rating ? "star" : "star-border"}
                  size={40}
                  color={star <= rating ? "#FFD700" : "#ccc"}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.commentInput}
            placeholder="Sürücü hakkında yorumunuz (opsiyonel)"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
        >
          <ThemedText style={styles.payButtonText}>
            Tamam
          </ThemedText>
        </TouchableOpacity>
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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addCardButton: {
    backgroundColor: '#3572EF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addCardButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  defaultBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  defaultText: {
    color: 'white',
    fontSize: 12,
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
  paymentInfoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  paymentAmountContainer: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3572EF',
  },
  paymentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentStatusText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  payButton: {
    backgroundColor: '#3572EF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ratingContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starButton: {
    padding: 5,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
  },
}); 
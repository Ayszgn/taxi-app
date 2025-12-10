import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { useAuth } from '@/context/AuthContext';
import { doc, getFirestore, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

interface Card {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  isDefault: boolean;
}

export default function CardsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCards();
  }, [user]);

  const fetchCards = async () => {
    if (user) {
      try {
        const db = getFirestore();
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log('Kullanıcı verileri:', data); // Debug için
          if (data.cards && Array.isArray(data.cards)) {
            setCards(data.cards);
          } else {
            // Eğer cards alanı yoksa veya dizi değilse boş dizi ata
            setCards([]);
            // Cards alanını oluştur
            await updateDoc(userRef, {
              cards: []
            });
          }
        }
      } catch (error) {
        console.error('Kartlar alınırken hata:', error);
        Alert.alert('Hata', 'Kartlar alınırken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSetDefault = async (cardId: string) => {
    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', user?.uid || '');
      
      // Önce tüm kartların isDefault değerini false yap
      const updatedCards = cards.map(card => ({
        ...card,
        isDefault: card.id === cardId
      }));

      await updateDoc(userRef, {
        cards: updatedCards
      });

      setCards(updatedCards);
    } catch (error) {
      console.error('Varsayılan kart ayarlanırken hata:', error);
      Alert.alert('Hata', 'Varsayılan kart ayarlanırken bir hata oluştu.');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    Alert.alert(
      'Kartı Sil',
      'Bu kartı silmek istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getFirestore();
              const userRef = doc(db, 'users', user?.uid || '');
              const cardToDelete = cards.find(card => card.id === cardId);
              
              if (cardToDelete) {
                await updateDoc(userRef, {
                  cards: arrayRemove(cardToDelete)
                });

                setCards(cards.filter(card => card.id !== cardId));
              }
            } catch (error) {
              console.error('Kart silinirken hata:', error);
              Alert.alert('Hata', 'Kart silinirken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <CustomHeader 
        title="Kartlarım" 
        rightIcon="plus.circle.fill"
        onRightIconPress={() => router.push('/(passenger-tabs)/add-card')}
        backgroundColor="#3572EF"
      />
      
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ThemedText>Yükleniyor...</ThemedText>
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="creditcard" size={64} color="#ccc" />
            <ThemedText style={styles.emptyText}>Henüz kayıtlı kartınız yok</ThemedText>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/(passenger-tabs)/add-card')}
            >
              <ThemedText style={styles.addButtonText}>Yeni Kart Ekle</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          cards.map((card) => (
            <View key={card.id} style={styles.cardContainer}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <IconSymbol name="creditcard.fill" size={40} color="white" />
                  {card.isDefault && (
                    <View style={styles.defaultBadge}>
                      <ThemedText style={styles.defaultText}>Varsayılan</ThemedText>
                    </View>
                  )}
                </View>
                
                <View style={styles.cardNumberContainer}>
                  <ThemedText style={styles.cardNumber}>
                    **** **** **** {card.cardNumber}
                  </ThemedText>
                </View>
                
                <View style={styles.cardDetails}>
                  <View>
                    <ThemedText style={styles.cardLabel}>Kart Sahibi</ThemedText>
                    <ThemedText style={styles.cardValue}>
                      {card.cardHolder}
                    </ThemedText>
                  </View>
                  
                  <View>
                    <ThemedText style={styles.cardLabel}>Son Kullanma</ThemedText>
                    <ThemedText style={styles.cardValue}>
                      {card.expiryDate}
                    </ThemedText>
                  </View>
                </View>
              </View>

              <View style={styles.cardActions}>
                {!card.isDefault && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleSetDefault(card.id)}
                  >
                    <IconSymbol name="star" size={20} color="#666" />
                    <ThemedText style={styles.actionText}>Varsayılan Yap</ThemedText>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteCard(card.id)}
                >
                  <IconSymbol name="trash" size={20} color="#ff3b30" />
                  <ThemedText style={[styles.actionText, styles.deleteText]}>Sil</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    marginTop: 10,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#3572EF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardContainer: {
    padding: 20,
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
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
  },
  actionText: {
    marginLeft: 5,
    color: '#666',
  },
  deleteButton: {
    marginLeft: 20,
  },
  deleteText: {
    color: '#ff3b30',
  },
}); 
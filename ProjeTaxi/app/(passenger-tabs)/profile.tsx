import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { user } = useAuth();
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    phoneNumber: string;
    phoneVerified: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const db = getFirestore();
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              name: data.name || '',
              email: data.email || '',
              phoneNumber: data.phoneNumber || '',
              phoneVerified: data.phoneVerified || false
            });
          }
        } catch (error) {
          console.error('Kullanıcı bilgileri alınırken hata:', error);
          Alert.alert('Hata', 'Kullanıcı bilgileri alınırken bir hata oluştu.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [user]);

  return (
    <ThemedView style={styles.container}>
      <CustomHeader 
        title="Profilim" 
        rightIcon="square.and.pencil" 
        onRightIconPress={() => alert('Profili Düzenle')} 
        backgroundColor="#3572EF"
      />

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <IconSymbol 
              size={100} 
              name="person.circle.fill" 
              color={Colors[colorScheme ?? 'light'].text} 
            />
            <TouchableOpacity style={styles.editButton}>
              <IconSymbol 
                size={20} 
                name="pencil.circle.fill" 
                color={Colors[colorScheme ?? 'light'].text} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <ThemedText style={styles.label}>Ad Soyad</ThemedText>
              <ThemedText style={styles.value}>
                {loading ? 'Yükleniyor...' : userData?.name || user?.displayName || 'İsim Soyisim'}
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <ThemedText style={styles.label}>E-posta</ThemedText>
              <ThemedText style={styles.value}>
                {loading ? 'Yükleniyor...' : userData?.email || 'E-posta'}
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <ThemedText style={styles.label}>Telefon</ThemedText>
              <View style={styles.phoneContainer}>
                <ThemedText style={styles.value}>
                  {loading ? 'Yükleniyor...' : 
                    userData?.phoneNumber && userData.phoneNumber.length === 10 ? 
                      `${userData.phoneNumber.slice(0, 3)} ${userData.phoneNumber.slice(3, 6)} ${userData.phoneNumber.slice(6)}` : 
                      'Belirtilmemiş'}
                </ThemedText>
                {userData?.phoneVerified && userData?.phoneNumber && (
                  <View style={styles.verifiedBadge}>
                    <ThemedText style={styles.verifiedText}>Onaylı</ThemedText>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/(passenger-tabs)/notification-settings')}
          >
            <IconSymbol 
              size={24} 
              name="bell.fill" 
              color={Colors[colorScheme ?? 'light'].text} 
            />
            <ThemedText style={styles.settingText}>Bildirim Ayarları</ThemedText>
            <IconSymbol 
              size={20} 
              name="chevron.right" 
              color={Colors[colorScheme ?? 'light'].text} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/(passenger-tabs)/change-password')}
          >
            <IconSymbol 
              size={24} 
              name="lock.fill" 
              color={Colors[colorScheme ?? 'light'].text} 
            />
            <ThemedText style={styles.settingText}>Şifre Değiştir</ThemedText>
            <IconSymbol 
              size={20} 
              name="chevron.right" 
              color={Colors[colorScheme ?? 'light'].text} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/(passenger-tabs)/language-settings')}
          >
            <IconSymbol 
              size={24} 
              name="globe" 
              color={Colors[colorScheme ?? 'light'].text} 
            />
            <ThemedText style={styles.settingText}>Dil Seçimi</ThemedText>
            <IconSymbol 
              size={20} 
              name="chevron.right" 
              color={Colors[colorScheme ?? 'light'].text} 
            />
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
  profileSection: {
    padding: 20,
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 5,
  },
  infoContainer: {
    width: '100%',
    marginTop: 20,
  },
  infoItem: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingsSection: {
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  verifiedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 
import { Drawer } from 'expo-router/drawer';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity, View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import React from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

function CustomDrawerContent() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [userData, setUserData] = React.useState<any>(null);
  React.useEffect(() => {
    async function fetchUserData() {
      if (user) {
        try {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (e) {
          // Hata durumunda sessizce geç
        }
      }
    }
    fetchUserData();
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Yönlendirme AuthContext içindeki useEffect tarafından otomatik olarak yapılacak
            } catch (error) {
              console.error('Çıkış yapılırken hata oluştu:', error);
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.userInfo}>
        <IconSymbol 
          size={60} 
          name="person.circle.fill" 
          color={Colors[colorScheme ?? 'light'].text} 
        />
        <ThemedText style={styles.userName}>
          {userData?.name || user?.displayName || user?.email || 'Kullanıcı'}
        </ThemedText>
        <ThemedText style={styles.userEmail}>
          {user?.email || 'E-posta'}
        </ThemedText>
      </View>

      <View style={styles.menuSection}>
        <ThemedText style={styles.sectionTitle}>Ana Sayfa</ThemedText>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/home')}
        >
          <IconSymbol 
            size={24} 
            name="house.fill" 
            color={Colors[colorScheme ?? 'light'].text} 
          />
          <ThemedText style={styles.menuItemText}>Ana Sayfa</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.menuSection}>
        <ThemedText style={styles.sectionTitle}>Hesabım</ThemedText>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/profile')}
        >
          <IconSymbol 
            size={24} 
            name="person.fill" 
            color={Colors[colorScheme ?? 'light'].text} 
          />
          <ThemedText style={styles.menuItemText}>Profilim</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/cards')}
        >
          <IconSymbol 
            size={24} 
            name="creditcard.fill" 
            color={Colors[colorScheme ?? 'light'].text} 
          />
          <ThemedText style={styles.menuItemText}>Kartlarım</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/history')}
        >
          <IconSymbol 
            size={24} 
            name="clock.fill" 
            color={Colors[colorScheme ?? 'light'].text} 
          />
          <ThemedText style={styles.menuItemText}>Geçmiş Yolculuklar</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.menuSection}>
        <ThemedText style={styles.sectionTitle}>Destek</ThemedText>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/help')}
        >
          <IconSymbol 
            size={24} 
            name="questionmark.circle.fill" 
            color={Colors[colorScheme ?? 'light'].text} 
          />
          <ThemedText style={styles.menuItemText}>Yardım Merkezi</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/contact')}
        >
          <IconSymbol 
            size={24} 
            name="envelope.fill" 
            color={Colors[colorScheme ?? 'light'].text} 
          />
          <ThemedText style={styles.menuItemText}>Bize Ulaşın</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/privacy')}
        >
          <IconSymbol 
            size={24} 
            name="lock.fill" 
            color={Colors[colorScheme ?? 'light'].text} 
          />
          <ThemedText style={styles.menuItemText}>Gizlilik Politikası</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.menuSection}>
        <ThemedText style={styles.sectionTitle}>Hesap</ThemedText>
        <TouchableOpacity 
          style={[styles.menuItem, styles.logoutButton]}
          onPress={handleLogout}
        >
          <IconSymbol 
            size={24} 
            name="rectangle.portrait.and.arrow.right" 
            color="#C80036" 
          />
          <ThemedText style={[styles.menuItemText, styles.logoutText]}>Çıkış Yap</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

export default function Layout() {
  return (
    <Drawer
      drawerContent={() => <CustomDrawerContent />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: '80%',
        },
      }}
    >
      <Drawer.Screen
        name="home"
        options={{
          title: 'Ana Sayfa',
          drawerIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="house.fill" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: 'Profilim',
          drawerIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="person.fill" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="cards"
        options={{
          title: 'Kartlarım',
          drawerIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="creditcard.fill" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="history"
        options={{
          title: 'Geçmiş Yolculuklar',
          drawerIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="clock.fill" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="help"
        options={{
          title: 'Yardım Merkezi',
          drawerIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="questionmark.circle.fill" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="contact"
        options={{
          title: 'Bize Ulaşın',
          drawerIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="envelope.fill" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="privacy"
        options={{
          title: 'Gizlilik Politikası',
          drawerIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="lock.fill" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="select-driver"
        options={{
          title: 'Sürücü Seç',
          drawerIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="person.2.fill" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="driver-on-the-way"
        options={{
          title: 'Sürücü Yolda',
          drawerIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="car.fill" color={color} />
          ),
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  userInfo: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 20,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  menuSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 10,
  },
  logoutButton: {
    marginTop: 10,
  },
  logoutText: {
    color: '#C80036',
  },
}); 
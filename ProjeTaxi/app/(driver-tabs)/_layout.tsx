import { Drawer } from 'expo-router/drawer';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { ThemedText } from '@/components/ThemedText';

const CustomDrawerContent = (props: any) => {
  const colorScheme = useColorScheme();
  const { signOut } = useAuth();

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <TouchableOpacity 
        style={{
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          marginTop: 16,
        }}
        onPress={signOut}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconSymbol 
            size={24} 
            name="rectangle.portrait.and.arrow.right" 
            color={Colors[colorScheme ?? 'light'].text} 
          />
          <ThemedText style={{ marginLeft: 32 }}>Çıkış Yap</ThemedText>
        </View>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
};

export default function DriverLayout() {
  const colorScheme = useColorScheme();

  return (
    <Drawer
      screenOptions={{
        headerTintColor: Colors[colorScheme ?? 'light'].tint,
        drawerActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="home"
        options={{
          title: 'Ana Sayfa',
          headerTitle: 'Ana Sayfa',
          drawerIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="house.fill" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="rides"
        options={{
          title: 'Sürüşlerim',
          headerTitle: 'Sürüşlerim',
          drawerIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="car.fill" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: 'Profilim',
          headerTitle: 'Profilim',
          drawerIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="person.fill" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          headerTitle: 'Ayarlar',
          drawerIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="gear" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="contact"
        options={{
          title: 'Bize Ulaşın',
          headerTitle: 'Bize Ulaşın',
          drawerIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="envelope.fill" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="complete-profile"
        options={{
          title: 'Hesabı Tamamla',
          headerTitle: 'Hesabı Tamamla',
          drawerIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="person.badge.plus" color={color} />
          ),
        }}
      />
    </Drawer>
  );
} 
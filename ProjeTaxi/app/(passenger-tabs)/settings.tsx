import { View, StyleSheet, Switch, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useState } from 'react';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { CustomHeader } from '@/components/ui/CustomHeader';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [emailUpdates, setEmailUpdates] = useState(false);

  return (
    <View style={styles.container}>
      <CustomHeader 
        title="Ayarlar" 
        rightIcon="info.circle" 
        onRightIconPress={() => alert('Ayarlar Hakkında')} 
        backgroundColor="#3572EF"
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Uygulama Ayarları</ThemedText>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol 
                name="bell.fill" 
                size={20} 
                color={Colors[colorScheme ?? 'light'].text} 
              />
              <ThemedText style={styles.settingText}>Bildirimler</ThemedText>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'light'].tint }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol 
                name="location.fill" 
                size={20} 
                color={Colors[colorScheme ?? 'light'].text} 
              />
              <ThemedText style={styles.settingText}>Konum Servisleri</ThemedText>
            </View>
            <Switch
              value={locationServices}
              onValueChange={setLocationServices}
              trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'light'].tint }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol 
                name="moon.fill" 
                size={20} 
                color={Colors[colorScheme ?? 'light'].text} 
              />
              <ThemedText style={styles.settingText}>Karanlık Mod</ThemedText>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'light'].tint }}
              thumbColor="#f4f3f4"
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>İletişim Tercihleri</ThemedText>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol 
                name="envelope.fill" 
                size={20} 
                color={Colors[colorScheme ?? 'light'].text} 
              />
              <ThemedText style={styles.settingText}>E-posta Bildirimleri</ThemedText>
            </View>
            <Switch
              value={emailUpdates}
              onValueChange={setEmailUpdates}
              trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'light'].tint }}
              thumbColor="#f4f3f4"
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Uygulama Bilgileri</ThemedText>
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Versiyon</ThemedText>
            <ThemedText style={styles.infoValue}>1.0.0</ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Lisans</ThemedText>
            <ThemedText style={styles.infoValue}>© 2023 Taxi App</ThemedText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    opacity: 0.7,
  },
}); 
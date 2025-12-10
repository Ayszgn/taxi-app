import React from 'react';
import { useState } from 'react';
import { StyleSheet, View, Switch, ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { CustomHeader } from '@/components/ui/CustomHeader';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [showEarnings, setShowEarnings] = useState(true);

  return (
    <ThemedView style={styles.container}>
      <CustomHeader 
        title="Ayarlar"
        rightIcon="info.circle"
        onRightIconPress={() => {/* Ayarlar hakkında bilgi */}}
        backgroundColor="#3572EF"
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Uygulama Ayarları</ThemedText>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol name="bell.fill" size={20} color="#344CB7" />
              <ThemedText style={styles.settingText}>Bildirimler</ThemedText>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={notifications ? '#0a7ea4' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol name="moon.fill" size={20} color="#344CB7" />
              <ThemedText style={styles.settingText}>Karanlık Mod</ThemedText>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={darkMode ? '#0a7ea4' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol name="envelope.fill" size={20} color="#344CB7" />
              <ThemedText style={styles.settingText}>E-posta Güncellemeleri</ThemedText>
            </View>
            <Switch
              value={emailUpdates}
              onValueChange={setEmailUpdates}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={emailUpdates ? '#0a7ea4' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Sürüş Ayarları</ThemedText>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#344CB7" />
              <ThemedText style={styles.settingText}>Otomatik Kabul</ThemedText>
            </View>
            <Switch
              value={autoAccept}
              onValueChange={setAutoAccept}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={autoAccept ? '#0a7ea4' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol name="dollarsign.circle.fill" size={20} color="#344CB7" />
              <ThemedText style={styles.settingText}>Kazançları Göster</ThemedText>
            </View>
            <Switch
              value={showEarnings}
              onValueChange={setShowEarnings}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={showEarnings ? '#0a7ea4' : '#f4f3f4'}
            />
          </View>
          
          <TouchableOpacity style={styles.settingButton}>
            <View style={styles.settingInfo}>
              <IconSymbol name="map.fill" size={20} color="#344CB7" />
              <ThemedText style={styles.settingText}>Tercih Edilen Bölgeler</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingButton}>
            <View style={styles.settingInfo}>
              <IconSymbol name="clock.fill" size={20} color="#344CB7" />
              <ThemedText style={styles.settingText}>Çalışma Saatleri</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Uygulama Bilgileri</ThemedText>
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Versiyon</ThemedText>
            <ThemedText style={styles.infoValue}>1.0.0</ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Lisans</ThemedText>
            <ThemedText style={styles.infoValue}>© 2023 TaxiApp</ThemedText>
          </View>
          
          <TouchableOpacity style={styles.settingButton}>
            <View style={styles.settingInfo}>
              <IconSymbol name="doc.text.fill" size={20} color="#344CB7" />
              <ThemedText style={styles.settingText}>Kullanım Koşulları</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingButton}>
            <View style={styles.settingInfo}>
              <IconSymbol name="lock.fill" size={20} color="#344CB7" />
              <ThemedText style={styles.settingText}>Gizlilik Politikası</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#666" />
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
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#344CB7',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 15,
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
  },
}); 
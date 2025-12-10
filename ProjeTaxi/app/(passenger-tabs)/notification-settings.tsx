import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Switch, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { useAuth } from '@/context/AuthContext';
import { doc, getFirestore, getDoc, updateDoc } from 'firebase/firestore';

export default function NotificationSettingsScreen() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    rideUpdates: true,
    promotions: false,
    news: false,
    paymentReminders: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (user) {
        try {
          const db = getFirestore();
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.notificationSettings) {
              setSettings(data.notificationSettings);
            }
          }
        } catch (error) {
          console.error('Bildirim ayarları alınırken hata:', error);
        }
      }
    };

    fetchSettings();
  }, [user]);

  const handleToggle = async (key: keyof typeof settings) => {
    try {
      const newSettings = { ...settings, [key]: !settings[key] };
      setSettings(newSettings);

      const db = getFirestore();
      const userRef = doc(db, 'users', user?.uid || '');
      await updateDoc(userRef, {
        notificationSettings: newSettings
      });
    } catch (error) {
      console.error('Bildirim ayarı güncellenirken hata:', error);
      Alert.alert('Hata', 'Bildirim ayarı güncellenirken bir hata oluştu.');
      // Hata durumunda eski ayara geri dön
      setSettings(settings);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <CustomHeader 
        title="Bildirim Ayarları" 
        backgroundColor="#3572EF"
        showBackButton={true}
      />
      
      <View style={styles.content}>
        <View style={styles.settingItem}>
          <ThemedText style={styles.settingText}>Yolculuk Güncellemeleri</ThemedText>
          <Switch
            value={settings.rideUpdates}
            onValueChange={() => handleToggle('rideUpdates')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.rideUpdates ? '#3572EF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <ThemedText style={styles.settingText}>Kampanyalar ve İndirimler</ThemedText>
          <Switch
            value={settings.promotions}
            onValueChange={() => handleToggle('promotions')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.promotions ? '#3572EF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <ThemedText style={styles.settingText}>Haberler ve Duyurular</ThemedText>
          <Switch
            value={settings.news}
            onValueChange={() => handleToggle('news')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.news ? '#3572EF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <ThemedText style={styles.settingText}>Ödeme Hatırlatıcıları</ThemedText>
          <Switch
            value={settings.paymentReminders}
            onValueChange={() => handleToggle('paymentReminders')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.paymentReminders ? '#3572EF' : '#f4f3f4'}
          />
        </View>
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingText: {
    fontSize: 16,
  },
}); 
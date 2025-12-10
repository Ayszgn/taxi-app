import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, ScrollView, Linking } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

export default function ContactScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSend = async () => {
    if (!name || !email || !subject || !message) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (!user) {
      Alert.alert('Hata', 'Mesaj göndermek için giriş yapmalısınız.');
      return;
    }

    setIsSubmitting(true);

    try {
      const driverContactsRef = collection(db, 'driverContacts');
      await addDoc(driverContactsRef, {
        userId: user.uid,
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      Alert.alert('Başarılı', 'Mesajınız gönderildi. En kısa sürede size dönüş yapacağız.');
      
      // Form alanlarını temizle
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      Alert.alert('Hata', 'Mesajınız gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCall = () => {
    Linking.openURL('tel:+902121234567');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:destek@taxiapp.com');
  };

  return (
    <ThemedView style={styles.container}>
      <CustomHeader 
        title="Bize Ulaşın"
        rightIcon="phone.fill"
        onRightIconPress={handleCall}
        backgroundColor="#3572EF"
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>İletişim Bilgileri</ThemedText>
          
          <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
            <IconSymbol name="phone.fill" size={24} color="#344CB7" />
            <ThemedText style={styles.contactText}>+90 212 123 45 67</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
            <IconSymbol name="envelope.fill" size={24} color="#344CB7" />
            <ThemedText style={styles.contactText}>destek@taxiapp.com</ThemedText>
          </TouchableOpacity>
          
          <View style={styles.contactItem}>
            <IconSymbol name="mappin.and.ellipse" size={24} color="#344CB7" />
            <ThemedText style={styles.contactText}>
              Levent Mah. Büyükdere Cad. No:123{'\n'}
              Şişli, İstanbul
            </ThemedText>
          </View>
          
          <View style={styles.contactItem}>
            <IconSymbol name="clock.fill" size={24} color="#344CB7" />
            <ThemedText style={styles.contactText}>
              Pazartesi - Cuma: 09:00 - 18:00{'\n'}
              Cumartesi: 10:00 - 14:00
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Sürücü Destek Hattı</ThemedText>
          <ThemedText style={styles.supportText}>
            Sürücü olarak özel destek hattımıza 7/24 ulaşabilirsiniz.
          </ThemedText>
          
          <TouchableOpacity 
            style={styles.supportButton}
            onPress={() => Linking.openURL('tel:+902129876543')}
          >
            <IconSymbol name="phone.circle.fill" size={24} color="white" />
            <ThemedText style={styles.supportButtonText}>Sürücü Destek Hattı</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Bize Yazın</ThemedText>
          
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Adınız"
              value={name}
              onChangeText={setName}
            />
            
            <TextInput
              style={styles.input}
              placeholder="E-posta Adresiniz"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Konu"
              value={subject}
              onChangeText={setSubject}
            />
            
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Mesajınız"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            
            <TouchableOpacity 
              style={[styles.sendButton, isSubmitting && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={isSubmitting}
            >
              <ThemedText style={styles.sendButtonText}>
                {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
              </ThemedText>
            </TouchableOpacity>
          </View>
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
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  contactText: {
    fontSize: 16,
    marginLeft: 15,
  },
  supportText: {
    fontSize: 16,
    marginBottom: 15,
  },
  supportButton: {
    backgroundColor: '#C80036',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  supportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  formContainer: {
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  messageInput: {
    height: 120,
  },
  sendButton: {
    backgroundColor: '#344CB7',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
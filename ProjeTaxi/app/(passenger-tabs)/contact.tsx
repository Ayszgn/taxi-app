import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

export default function ContactScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactMethods = [
    {
      id: '1',
      title: 'E-posta',
      description: 'destek@protaxi.com',
      icon: 'envelope' as const,
    },
    {
      id: '2',
      title: 'Telefon',
      description: '+90 850 123 45 67',
      icon: 'phone' as const,
    },
    {
      id: '3',
      title: 'Adres',
      description: 'İstanbul, Türkiye',
      icon: 'location' as const,
    },
  ];

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Hata', 'Lütfen konu ve mesaj alanlarını doldurun.');
      return;
    }

    if (!user) {
      Alert.alert('Hata', 'Mesaj göndermek için giriş yapmalısınız.');
      return;
    }

    setIsSubmitting(true);

    try {
      const contactsRef = collection(db, 'contacts');
      await addDoc(contactsRef, {
        userId: user.uid,
        subject: subject.trim(),
        message: message.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        'Başarılı',
        'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.',
        [
          {
            text: 'Tamam',
            onPress: () => {
              setSubject('');
              setMessage('');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      Alert.alert('Hata', 'Mesajınız gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <CustomHeader 
        title="Bize Ulaşın" 
        backgroundColor="#3572EF"
      />

      <ScrollView style={styles.content}>
        <View style={styles.contactMethodsContainer}>
          {contactMethods.map((method) => (
            <View key={method.id} style={styles.contactMethod}>
              <IconSymbol 
                size={24} 
                name={method.icon} 
                color="#3572EF" 
              />
              <View style={styles.contactMethodInfo}>
                <ThemedText style={styles.contactMethodTitle}>{method.title}</ThemedText>
                <ThemedText style={styles.contactMethodDescription}>{method.description}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.formContainer}>
          <ThemedText style={styles.formTitle}>Mesaj Gönder</ThemedText>
          
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Konu</ThemedText>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="Mesajınızın konusunu yazın"
              placeholderTextColor="#999"
              maxLength={100}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Mesajınız</ThemedText>
            <TextInput
              style={[styles.input, styles.messageInput]}
              value={message}
              onChangeText={setMessage}
              placeholder="Mesajınızı yazın"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={1000}
              editable={!isSubmitting}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <ThemedText style={styles.submitButtonText}>
              {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
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
    padding: 20,
  },
  contactMethodsContainer: {
    marginBottom: 30,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  contactMethodInfo: {
    marginLeft: 15,
  },
  contactMethodTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  contactMethodDescription: {
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 10,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  messageInput: {
    height: 120,
  },
  submitButton: {
    backgroundColor: '#3572EF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
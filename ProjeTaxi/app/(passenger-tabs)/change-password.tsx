import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Alert, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { useAuth } from '@/context/AuthContext';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export default function ChangePasswordScreen() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);

    try {
      if (!user || !user.email) {
        throw new Error('Kullanıcı bilgisi bulunamadı.');
      }

      // Mevcut şifreyi doğrula
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Şifreyi güncelle
      await updatePassword(user, newPassword);

      Alert.alert('Başarılı', 'Şifreniz başarıyla güncellendi.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Şifre değiştirme hatası:', error);
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Hata', 'Mevcut şifre yanlış.');
      } else {
        Alert.alert('Hata', 'Şifre değiştirilirken bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <CustomHeader 
        title="Şifre Değiştir" 
        backgroundColor="#3572EF"
        showBackButton={true}
      />
      
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Mevcut Şifre</ThemedText>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="Mevcut şifrenizi girin"
          />
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Yeni Şifre</ThemedText>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="Yeni şifrenizi girin"
          />
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Yeni Şifre (Tekrar)</ThemedText>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Yeni şifrenizi tekrar girin"
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
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
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3572EF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

type UserType = 'passenger' | 'driver';

export default function RegisterScreen() {
  const [userType, setUserType] = useState<UserType>('passenger');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    try {
      setLoading(true);
      await signUp(email, password, userType, name);
    } catch (error: any) {
      Alert.alert('Kayıt Hatası', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Yeni Hesap Oluştur
      </ThemedText>

      <ThemedView style={styles.userTypeContainer}>
        <TouchableOpacity
          style={[styles.userTypeButton, userType === 'passenger' && styles.activeUserType]}
          onPress={() => setUserType('passenger')}>
          <ThemedText style={[userType === 'passenger' && styles.activeText]}>Yolcu</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.userTypeButton, userType === 'driver' && styles.activeUserType]}
          onPress={() => setUserType('driver')}>
          <ThemedText style={[userType === 'driver' && styles.activeText]}>Sürücü</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.formContainer}>
        <Input
          placeholder="Ad Soyad"
          value={name}
          onChangeText={setName}
        />
        <Input
          placeholder="E-posta"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={[styles.registerButton, loading && styles.disabledButton]} 
          onPress={handleRegister}
          disabled={loading}>
          <ThemedText style={styles.registerButtonText}>
            {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
          </ThemedText>
        </TouchableOpacity>

        <Link href="/auth/login" style={styles.loginLink}>
          <ThemedText type="link" style={{color:'#344CB7', textDecorationLine:'underline'}}>Zaten hesabınız var mı? Giriş yapın</ThemedText>
        </Link>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
    color:'#344CB7',
  },
  userTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  userTypeButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  activeUserType: {
    backgroundColor: '#3572EF',
  },
  activeText: {
    color: '#ffffff',
  },
  formContainer: {
    gap: 15,
  },
  registerButton: {
    backgroundColor: '#C80036',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    alignSelf: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
}); 
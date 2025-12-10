import { useState } from 'react';
import { StyleSheet, TouchableOpacity, Alert, View, Image } from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

type UserType = 'passenger' | 'driver';

export default function LoginScreen() {
  const [userType, setUserType] = useState<UserType>('passenger');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password, userType);
    } catch (error: any) {
      Alert.alert('Giriş Hatası', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/images/taxilogo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <ThemedText type="title" style={styles.title}>
        Sür&Öde Hoşgeldiniz
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
          style={[styles.loginButton, loading && styles.disabledButton]} 
          onPress={handleLogin}
          disabled={loading}>
          <ThemedText style={styles.loginButtonText}>
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </ThemedText>
        </TouchableOpacity>

        <Link href="/auth/register" style={styles.registerLink}>
          <ThemedText type="link" style={{color:'#344CB7', textDecorationLine:'underline'}}>Hesabınız yok mu? Kayıt olun</ThemedText>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 200,
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
    color:'#344CB7',
    fontSize:28
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
  loginButton: {
    backgroundColor: '#C80036',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    width:'50%',
    alignSelf:'center'
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerLink: {
    alignSelf: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
}); 
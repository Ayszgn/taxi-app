import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter } from 'expo-router';
import { CustomHeader } from '@/components/ui/CustomHeader';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <CustomHeader 
        title="Gizlilik Politikası" 
        backgroundColor="#3572EF"
      />

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>1. Giriş</ThemedText>
          <ThemedText style={styles.sectionText}>
            ProTaxi olarak kişisel verilerinizin güvenliğine önem veriyoruz. Bu gizlilik politikası, 
            uygulamamızı kullanırken topladığımız bilgilerin nasıl kullanıldığını ve korunduğunu açıklar.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>2. Toplanan Bilgiler</ThemedText>
          <ThemedText style={styles.sectionText}>
            • Kişisel bilgiler (ad, soyad, e-posta, telefon numarası){'\n'}
            • Konum bilgileri{'\n'}
            • Ödeme bilgileri{'\n'}
            • Cihaz bilgileri
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>3. Bilgilerin Kullanımı</ThemedText>
          <ThemedText style={styles.sectionText}>
            • Hizmetlerimizi iyileştirmek{'\n'}
            • Müşteri desteği sağlamak{'\n'}
            • Güvenlik ve dolandırıcılık önleme{'\n'}
            • Yasal yükümlülükleri yerine getirmek
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>4. Bilgi Paylaşımı</ThemedText>
          <ThemedText style={styles.sectionText}>
            Kişisel bilgileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmaz. 
            Sürücülerle paylaşılan bilgiler sadece yolculuk gerçekleştirmek için gereklidir.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>5. Veri Güvenliği</ThemedText>
          <ThemedText style={styles.sectionText}>
            Verilerinizi korumak için gerekli teknik ve organizasyonel önlemleri alıyoruz. 
            Ancak internet üzerinden veri iletiminin %100 güvenli olmadığını unutmayın.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>6. Haklarınız</ThemedText>
          <ThemedText style={styles.sectionText}>
            KVKK kapsamında kişisel verilerinize erişim, düzeltme, silme ve işlenmesine 
            itiraz etme hakkına sahipsiniz.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>7. İletişim</ThemedText>
          <ThemedText style={styles.sectionText}>
            Gizlilik politikamız hakkında sorularınız için destek@protaxi.com adresinden 
            bize ulaşabilirsiniz.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>8. Değişiklikler</ThemedText>
          <ThemedText style={styles.sectionText}>
            Bu politika zaman zaman güncellenebilir. Değişiklikler uygulama üzerinden 
            duyurulacaktır.
          </ThemedText>
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#3572EF',
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
}); 
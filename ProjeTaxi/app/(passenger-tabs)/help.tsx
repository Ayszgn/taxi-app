import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { CustomHeader } from '@/components/ui/CustomHeader';

export default function HelpScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const faqCategories = [
    {
      id: '1',
      title: 'Yolculuk Hakkında',
      questions: [
        {
          id: '1',
          question: 'Nasıl yolculuk oluşturabilirim?',
          answer: 'Ana sayfada "Yolculuk Başlat" butonuna tıklayarak yolculuk oluşturabilirsiniz. Başlangıç ve bitiş noktalarını seçtikten sonra sürücü seçimine geçebilirsiniz.',
        },
        {
          id: '2',
          question: 'Yolculuk ücreti nasıl hesaplanır?',
          answer: 'Yolculuk ücreti, mesafe, trafik durumu ve günün saatine göre otomatik olarak hesaplanır. Ücret, yolculuk başlamadan önce size gösterilir.',
        },
      ],
    },
    {
      id: '2',
      title: 'Ödeme İşlemleri',
      questions: [
        {
          id: '3',
          question: 'Hangi ödeme yöntemlerini kullanabilirim?',
          answer: 'Kredi kartı, banka kartı ve mobil ödeme yöntemlerini kullanabilirsiniz. Ödeme yöntemlerinizi "Kartlarım" sayfasından yönetebilirsiniz.',
        },
        {
          id: '4',
          question: 'Ödeme iadesi nasıl yapılır?',
          answer: 'İptal edilen yolculuklar için ödeme iadesi otomatik olarak yapılır. İade süreci bankanıza bağlı olarak 3-5 iş günü sürebilir.',
        },
      ],
    },
    {
      id: '3',
      title: 'Hesap ve Güvenlik',
      questions: [
        {
          id: '5',
          question: 'Şifremi nasıl değiştirebilirim?',
          answer: 'Profil sayfanızdan "Şifre Değiştir" seçeneğine tıklayarak şifrenizi değiştirebilirsiniz.',
        },
        {
          id: '6',
          question: 'Hesabımı nasıl silebilirim?',
          answer: 'Hesabınızı silmek için "Bize Ulaşın" sayfasından destek ekibimizle iletişime geçebilirsiniz.',
        },
      ],
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <CustomHeader 
        title="Yardım Merkezi" 
        backgroundColor="#3572EF"
      />

      <ScrollView style={styles.content}>
        {faqCategories.map((category) => (
          <View key={category.id} style={styles.categoryContainer}>
            <ThemedText style={styles.categoryTitle}>{category.title}</ThemedText>
            {category.questions.map((question) => (
              <TouchableOpacity 
                key={question.id} 
                style={styles.questionContainer}
              >
                <ThemedText style={styles.questionText}>{question.question}</ThemedText>
                <ThemedText style={styles.answerText}>{question.answer}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.contactContainer}>
          <ThemedText style={styles.contactTitle}>Hala yardıma mı ihtiyacınız var?</ThemedText>
          <TouchableOpacity style={styles.contactButton}>
            <IconSymbol 
              size={24} 
              name="envelope.fill" 
              color="white" 
            />
            <ThemedText style={styles.contactButtonText}>Bize Ulaşın</ThemedText>
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
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    backgroundColor: '#3572EF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  categoryContainer: {
    marginBottom: 25,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  questionContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 10,
    padding: 15,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  contactContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 16,
    marginBottom: 15,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3572EF',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    padding: 10,
  },
  answerText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
}); 
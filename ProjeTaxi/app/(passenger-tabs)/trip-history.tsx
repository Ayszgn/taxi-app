import { View, StyleSheet, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { CustomHeader } from '@/components/ui/CustomHeader';

// Örnek yolculuk verileri
const TRIPS = [
  {
    id: '1',
    date: '15 Şubat 2023',
    from: 'Kadıköy',
    to: 'Beşiktaş',
    price: '45 TL',
    status: 'Tamamlandı',
  },
  {
    id: '2',
    date: '10 Şubat 2023',
    from: 'Ataşehir',
    to: 'Levent',
    price: '65 TL',
    status: 'Tamamlandı',
  },
  {
    id: '3',
    date: '5 Şubat 2023',
    from: 'Üsküdar',
    to: 'Taksim',
    price: '55 TL',
    status: 'Tamamlandı',
  },
  {
    id: '4',
    date: '1 Şubat 2023',
    from: 'Beylikdüzü',
    to: 'Bakırköy',
    price: '85 TL',
    status: 'Tamamlandı',
  },
  {
    id: '5',
    date: '25 Ocak 2023',
    from: 'Maltepe',
    to: 'Kadıköy',
    price: '40 TL',
    status: 'Tamamlandı',
  },
];

// Yolculuk tipi tanımı
type Trip = {
  id: string;
  date: string;
  from: string;
  to: string;
  price: string;
  status: string;
};

export default function TripHistoryScreen() {
  const colorScheme = useColorScheme();

  const renderTripItem = ({ item }: { item: Trip }) => (
    <View style={styles.tripItem}>
      <View style={styles.tripHeader}>
        <ThemedText style={styles.tripDate}>{item.date}</ThemedText>
        <ThemedText style={[styles.tripStatus, { color: Colors[colorScheme ?? 'light'].tint }]}>
          {item.status}
        </ThemedText>
      </View>
      <View style={styles.tripRoute}>
        <ThemedText style={styles.tripLocation}>{item.from}</ThemedText>
        <View style={styles.arrow}>
          <ThemedText>→</ThemedText>
        </View>
        <ThemedText style={styles.tripLocation}>{item.to}</ThemedText>
      </View>
      <View style={styles.tripFooter}>
        <ThemedText style={styles.tripPrice}>{item.price}</ThemedText>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomHeader 
        title="Yolculuk Geçmişlerim" 
        rightIcon="arrow.up.arrow.down" 
        onRightIconPress={() => alert('Sırala')} 
        backgroundColor="#3572EF"
      />
      
      <FlatList
        data={TRIPS}
        renderItem={renderTripItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  tripItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tripDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  tripStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tripRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tripLocation: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  arrow: {
    paddingHorizontal: 10,
  },
  tripFooter: {
    alignItems: 'flex-end',
  },
  tripPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 
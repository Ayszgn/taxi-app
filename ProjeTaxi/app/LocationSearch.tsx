import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: { selectedLocation: { latitude: number; longitude: number; display_name: string } };
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  route: any;
};

type LocationResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
};

export default function LocationSearch({ navigation, route }: Props) {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Konum arama hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location: LocationResult) => {
    navigation.navigate('Home', {
      selectedLocation: {
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lon),
        display_name: location.display_name
      }
    });
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={24} color="#666" />
        <TextInput
          style={styles.input}
          placeholder="Konum ara..."
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            searchLocations(text);
          }}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3572EF" />
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.place_id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => handleLocationSelect(item)}
            >
              <ThemedText>{item.display_name}</ThemedText>
            </TouchableOpacity>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  }
}); 
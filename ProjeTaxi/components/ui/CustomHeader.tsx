import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from './IconSymbol';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';

type CustomHeaderProps = {
  title: string;
  rightIcon?: any;
  onRightIconPress?: () => void;
  backgroundColor?: string;
  showBackButton?: boolean;
};

export function CustomHeader({ 
  title, 
  rightIcon, 
  onRightIconPress,
  backgroundColor = '#3572EF',
  showBackButton = false
}: CustomHeaderProps) {
  const colorScheme = useColorScheme();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const router = useRouter();

  const handleLeftButtonPress = () => {
    if (showBackButton) {
      router.push('/(passenger-tabs)/profile');
    } else {
      navigation.openDrawer();
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: backgroundColor }]}>
      <View style={styles.leftSection}>
        {showBackButton ? (
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => router.push('/(passenger-tabs)/profile')}
          >
            <IconSymbol name="chevron.left" size={24} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => navigation.openDrawer()}
          >
            <IconSymbol name="line.3.horizontal" size={24} color="white" />
          </TouchableOpacity>
        )}
        
        <ThemedText style={styles.title}>{title}</ThemedText>
      </View>
      
      {rightIcon ? (
        <TouchableOpacity 
          style={styles.rightButton} 
          onPress={onRightIconPress}
        >
          <IconSymbol name={rightIcon} size={24} color="white" />
        </TouchableOpacity>
      ) : (
        <View style={styles.rightButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  rightButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 
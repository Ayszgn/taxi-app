import React from 'react';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { View, useColorScheme } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';

type Props = DrawerContentComponentProps;

export function CustomDrawerContent(props: Props) {
  const colorScheme = useColorScheme();
  const { signOut } = useAuth();

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <TouchableOpacity 
        style={{
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          marginTop: 16,
        }}
        onPress={signOut}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconSymbol 
            size={24} 
            name="rectangle.portrait.and.arrow.right" 
            color={Colors[colorScheme ?? 'light'].text} 
          />
          <ThemedText style={{ marginLeft: 32 }}>Çıkış Yap</ThemedText>
        </View>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}
 
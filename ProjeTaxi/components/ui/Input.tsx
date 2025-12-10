import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export function Input(props: TextInputProps) {
  const theme = useColorScheme() ?? 'light';
  
  return (
    <TextInput
      style={[
        styles.input,
        {
          color: Colors[theme].text,
          backgroundColor: theme === 'light' ? '#f5f5f5' : '#2a2a2a',
          borderColor: theme === 'light' ? '#e0e0e0' : '#404040',
        },
      ]}
      placeholderTextColor={theme === 'light' ? '#666666' : '#888888'}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
}); 
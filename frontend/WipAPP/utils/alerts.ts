import { Alert, Platform } from "react-native";

// Crea un archivo utils/alerts.ts
export const showAlert = {
  confirm: (title: string, message: string, callback: () => void): void => {
    if (Platform.OS === 'web') {
      const result = window.confirm(`${title}\n\n${message}`);
      if (result) callback();
    } else {
      Alert.alert(title, message, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Aceptar', onPress: callback }
      ]);
    }
  },
  
  alert: (title: string, message: string): void => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  },
  
  error: (message: string): void => {
    showAlert.alert('❌ Error', message);
  },
  
  success: (message: string): void => {
    showAlert.alert('✅ Éxito', message);
  }
};
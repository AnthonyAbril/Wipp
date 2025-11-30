import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { carAPI } from '../services/carAPI';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = StackScreenProps<RootStackParamList, 'LinkCar'>;

export default function LinkCarScreen({ navigation }: Props) {
  const [licensePlate, setLicensePlate] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    licensePlate: '',
    pinCode: '',
    general: '' // <- nuevo campo para errores generales
  });

  const validateForm = (): boolean => {
    const newErrors = {
      licensePlate: '',
      pinCode: '',
      general: '' // <- Agregar esta línea
    };

    let isValid = true;

    if (!licensePlate.trim()) {
      newErrors.licensePlate = 'La matrícula es requerida';
      isValid = false;
    } else if (licensePlate.trim().length < 4) {
      newErrors.licensePlate = 'La matrícula debe tener al menos 4 caracteres';
      isValid = false;
    }

    if (!pinCode.trim()) {
      newErrors.pinCode = 'El PIN es requerido';
      isValid = false;
    } else if (pinCode.trim().length < 4) {
      newErrors.pinCode = 'El PIN debe tener al menos 4 dígitos';
      isValid = false;
    } else if (!/^\d+$/.test(pinCode)) {
      newErrors.pinCode = 'El PIN debe contener solo números';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLinkCar = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({
      licensePlate: '',
      pinCode: '',
      general: ''
    });

    try {
      await carAPI.linkCar(licensePlate.toUpperCase().replace(/\s/g, ''), pinCode);
      
      Alert.alert(
        '✅ Coche Vinculado',
        `El coche con matrícula ${licensePlate.toUpperCase()} ha sido vinculado exitosamente.`,
        [
          {
            text: 'Aceptar',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    
  } catch (error: any) {
    console.error('Error linking car:', error);
    
    // Manejar errores de validación del backend
    if (error.message && typeof error.message === 'string') {
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.errors) {
          // Mapear errores del backend a los campos del formulario
          const newErrors = {
            licensePlate: '',
            pinCode: '',
            general: ''
          };

          if (errorData.errors.license_plate) {
            newErrors.licensePlate = errorData.errors.license_plate[0];
          }
          if (errorData.errors.pin_code) {
            newErrors.pinCode = errorData.errors.pin_code[0];
          }
          if (errorData.message && !newErrors.licensePlate && !newErrors.pinCode) {
            newErrors.general = errorData.message;
          }

          setErrors(newErrors);
          return;
        }
      } catch (e) {
        // Si no es JSON, continuar con el manejo normal
      }
    }
    
    let errorMessage = 'Error al vincular el coche';
    
    if (error.message.includes('No se encontró ningún coche con esa matrícula')) {
      setErrors({
        licensePlate: 'No se encontró ningún coche con esta matrícula',
        pinCode: '',
        general: ''
      });
    } else if (error.message.includes('PIN incorrecto')) {
      setErrors({
        licensePlate: '',
        pinCode: 'PIN incorrecto',
        general: ''
      });
    } else if (error.message.includes('Ya tienes este coche vinculado')) {
      setErrors({
        licensePlate: 'Ya tienes este coche vinculado',
        pinCode: '',
        general: ''
      });
    } else if (error.message.includes('Network request failed')) {
      setErrors({
        licensePlate: '',
        pinCode: '',
        general: 'Error de conexión. Verifica tu conexión a internet.'
      });
    } else {
      setErrors({
        licensePlate: '',
        pinCode: '',
        general: error.message || 'Error desconocido al vincular el coche'
      });
    }
  } finally {
    setLoading(false);
  }
};


  const clearError = (field: keyof typeof errors) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Vincular Coche</Text>
            <Text style={styles.subtitle}>
              Introduce la matrícula y PIN del coche que quieres vincular a tu cuenta
            </Text>
          </View>

          <View style={styles.form}>
            {/* Campo Matrícula */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Matrícula del Coche</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.licensePlate ? styles.inputError : null,
                ]}
                placeholder="Ej: ABC1234"
                placeholderTextColor="#999"
                value={licensePlate}
                onChangeText={(text) => {
                  setLicensePlate(text);
                  clearError('licensePlate');
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={20}
                editable={!loading}
              />
              {errors.licensePlate ? (
                <Text style={styles.errorText}>{errors.licensePlate}</Text>
              ) : null}
            </View>

            {/* Campo PIN */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>PIN del Coche</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.pinCode ? styles.inputError : null,
                ]}
                placeholder="Ej: 1234"
                placeholderTextColor="#999"
                value={pinCode}
                onChangeText={(text) => {
                  setPinCode(text);
                  clearError('pinCode');
                }}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                editable={!loading}
              />
              {errors.pinCode ? (
                <Text style={styles.errorText}>{errors.pinCode}</Text>
              ) : null}
              <Text style={styles.helperText}>
                El PIN es de 4 a 6 dígitos proporcionado cuando se registró el coche
              </Text>
            </View>

            {/* Botón de Vincular */}
            <TouchableOpacity
              style={[
                styles.linkButton,
                loading ? styles.linkButtonDisabled : null,
              ]}
              onPress={handleLinkCar}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.linkButtonText}>Vincular Coche</Text>
              )}
            </TouchableOpacity>
            
            {errors.general ? (
              <View style={styles.generalErrorContainer}>
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            ) : null}

            {/* Información adicional */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>💡 ¿Primera vez?</Text>
              <Text style={styles.infoText}>
                • La matrícula debe coincidir exactamente con la registrada{'\n'}
                • El PIN es numérico y fue establecido al crear el coche{'\n'}
                • El coche debe estar previamente registrado en el sistema
              </Text>
            </View>

            {/* Botón de cancelar */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 6,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
  linkButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  linkButtonDisabled: {
    backgroundColor: '#84BFFF',
  },
  linkButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  generalErrorContainer: {
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    marginBottom: 16,
  },
  generalErrorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
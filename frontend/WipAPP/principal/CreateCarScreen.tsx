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
  Image,
  Modal
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { carAPI } from '../services/carAPI';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

type Props = StackScreenProps<RootStackParamList, 'CreateCar'>;

interface CreateCarForm {
  license_plate: string;
  pin_code: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  vin: string;
  car_image: string | null; // ← Añadir este campo
  _car_image_file?: File | null
}

interface FormErrors {
  license_plate?: string;
  pin_code?: string;
  brand?: string;
  model?: string;
  year?: string;
  color?: string;
  vin?: string;
  general?: string;
}

export default function CreateCarScreen({ navigation }: Props) {
  const [form, setForm] = useState<CreateCarForm>({
    license_plate: '',
    pin_code: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    vin: '',
    car_image: null, // ← Añadir esto
    _car_image_file: null, // ← AGREGAR ESTA LÍNEA
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.license_plate.trim()) {
      newErrors.license_plate = 'La matrícula es requerida';
    } else if (form.license_plate.trim().length < 4) {
      newErrors.license_plate = 'La matrícula debe tener al menos 4 caracteres';
    }

    if (!form.pin_code.trim()) {
      newErrors.pin_code = 'El PIN es requerido';
    } else if (form.pin_code.trim().length < 4) {
      newErrors.pin_code = 'El PIN debe tener al menos 4 dígitos';
    } else if (!/^\d+$/.test(form.pin_code)) {
      newErrors.pin_code = 'El PIN debe contener solo números';
    }

    if (form.year && !/^\d+$/.test(form.year)) {
      newErrors.year = 'El año debe ser un número válido';
    } else if (form.year) {
      const yearNum = parseInt(form.year);
      const currentYear = new Date().getFullYear();
      if (yearNum < 1900 || yearNum > currentYear + 1) {
        newErrors.year = `El año debe estar entre 1900 y ${currentYear + 1}`;
      }
    }

    if (form.vin && form.vin.length !== 17) {
      newErrors.vin = 'El VIN debe tener exactamente 17 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCar = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Preparar datos para FormData
      const carData: any = {
        license_plate: form.license_plate.toUpperCase().replace(/\s/g, ''),
        pin_code: form.pin_code,
        brand: form.brand || null,
        model: form.model || null,
        year: form.year ? parseInt(form.year) : null,
        color: form.color || null,
        vin: form.vin || null,
        car_image: form.car_image,
        _car_image_file: form._car_image_file,
      };

      // Manejar la imagen de forma diferente para web vs móvil
      if (Platform.OS === 'web' && form._car_image_file) {
        // Web: usar el File directamente
        carData.car_image = form._car_image_file;
      } else if (Platform.OS !== 'web' && form.car_image) {
        // Mobile: la URI ya está en form.car_image
        carData.car_image = form.car_image;
      }

      await carAPI.createCar(carData);
      
      Alert.alert(
        '✅ Coche Creado',
        `El coche con matrícula ${form.license_plate.toUpperCase()} ha sido creado exitosamente.`,
        [
          {
            text: 'Ver Coche',
            onPress: () => {
              // Opción 1: Recargar y volver atrás
              navigation.navigate('Home', { refresh: true });
            },
          },
          {
            text: 'Seguir Creando',
            style: 'cancel',
            onPress: () => {
              // Limpiar formulario para crear otro
              setForm({
                license_plate: '',
                pin_code: '',
                brand: '',
                model: '',
                year: '',
                color: '',
                vin: '',
                car_image: null,
                _car_image_file: null,
              });
              setImage(null);
            },
          },
        ]
      );
      
    } catch (error: any) {
    console.error('Error creating car:', error);
    
      // Manejar errores de validación del backend
      if (error.message) {
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.errors) {
            const backendErrors: FormErrors = {};
            Object.keys(errorData.errors).forEach(key => {
              if (errorData.errors[key] && errorData.errors[key][0]) {
                // Mapear 'car_image' a un mensaje general si existe
                if (key === 'car_image') {
                  backendErrors.general = `Error en imagen: ${errorData.errors[key][0]}`;
                } else {
                  backendErrors[key as keyof FormErrors] = errorData.errors[key][0];
                }
              }
            });
            setErrors(backendErrors);
            return;
          }
        } catch (e) {
          // Si no es JSON, mostrar error general
        }
      }
      
      let errorMessage = 'Error al crear el coche';
      
      if (error.message.includes('Network request failed')) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
      } else if (error.message.includes('license_plate already exists')) {
        errorMessage = 'Ya existe un coche con esta matrícula.';
      } else if (error.message.includes('Imagen inválida')) {
        errorMessage = error.message;
      } else {
        errorMessage = error.message || 'Error desconocido al crear el coche';
      }
      
      Alert.alert('❌ Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: keyof FormErrors) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const updateForm = (field: keyof CreateCarForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    clearError(field as keyof FormErrors);
  };

  //Funciones para el manejo de imagen
  const [image, setImage] = useState<string | null>(null);
  const [showImageOptions, setShowImageOptions] = useState(false);

  // FUNCIÓN PRINCIPAL QUE DETECTA LA PLATAFORMA
  const handleSelectImagePress = () => {
    if (Platform.OS === 'web') {
      handleImagePickWeb();
    } else {
      // Solo en móvil mostramos el modal con opciones
      setShowImageOptions(true);
    }
  };

  // FUNCIÓN ESPECÍFICA PARA WEB - VERSIÓN CORREGIDA
  const handleImagePickWeb = () => {
    return new Promise<void>((resolve) => {
      try {
        // Crear un input de tipo file oculto
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async (event: any) => {
          const file = event.target.files?.[0];
          if (!file) {
            resolve();
            return;
          }
          
          // Validar tamaño (opcional, recomendado)
          const maxSize = 5 * 1024 * 1024; // 5MB
          if (file.size > maxSize) {
            Alert.alert('Error', 'La imagen es demasiado grande. Máximo 5MB.');
            resolve();
            return;
          }
          
          // Crear URL para previsualización
          const imageUri = URL.createObjectURL(file);
          setImage(imageUri);
          
          // Guardar el archivo REAL para enviar al backend
          // Convertimos el File a un formato que FormData pueda enviar
          setForm(prev => ({ 
            ...prev, 
            car_image: imageUri,
            // Necesitamos guardar el archivo real para el envío
            _car_image_file: file  // ← Guardamos el archivo real
          }));
          
          resolve();
        };
        
        // Disparar el clic
        input.click();
      } catch (error) {
        console.error('Error en selector web:', error);
        Alert.alert('Error', 'No se pudo seleccionar la imagen');
        resolve();
      }
    });
  };

  // FUNCIONES ESPECÍFICAS PARA MÓVIL (se mantienen igual)
  const handleImagePickMobile = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para seleccionar una imagen');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setForm(prev => ({ ...prev, car_image: result.assets[0].uri }));
      setShowImageOptions(false);
    }
  };

  const handleTakePhotoMobile = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara para tomar una foto');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setForm(prev => ({ ...prev, car_image: result.assets[0].uri }));
      setShowImageOptions(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    setForm(prev => ({ 
      ...prev, 
      car_image: null,
      _car_image_file: null
    }));
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
            <Text style={styles.title}>Crear Nuevo Coche</Text>
            <Text style={styles.subtitle}>
              Registra un nuevo coche en el sistema y vincúlalo a tu cuenta
            </Text>
          </View>

          <View style={styles.form}>
            {/* Campo Matrícula */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Matrícula *</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.license_plate ? styles.inputError : null,
                ]}
                placeholder="Ej: ABC1234"
                placeholderTextColor="#999"
                value={form.license_plate}
                onChangeText={(text) => updateForm('license_plate', text)}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={20}
                editable={!loading}
              />
              {errors.license_plate ? (
                <Text style={styles.errorText}>{errors.license_plate}</Text>
              ) : null}
            </View>

            {/* Campo PIN */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>PIN *</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.pin_code ? styles.inputError : null,
                ]}
                placeholder="Ej: 1234"
                placeholderTextColor="#999"
                value={form.pin_code}
                onChangeText={(text) => updateForm('pin_code', text)}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                editable={!loading}
              />
              {errors.pin_code ? (
                <Text style={styles.errorText}>{errors.pin_code}</Text>
              ) : null}
              <Text style={styles.helperText}>
                El PIN debe tener 4-6 dígitos. Guárdalo en un lugar seguro.
              </Text>
            </View>

            {/* Campo Marca */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Marca</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.brand ? styles.inputError : null,
                ]}
                placeholder="Ej: Toyota"
                placeholderTextColor="#999"
                value={form.brand}
                onChangeText={(text) => updateForm('brand', text)}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={50}
                editable={!loading}
              />
              {errors.brand ? (
                <Text style={styles.errorText}>{errors.brand}</Text>
              ) : null}
            </View>

            {/* Campo Modelo */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Modelo</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.model ? styles.inputError : null,
                ]}
                placeholder="Ej: Corolla"
                placeholderTextColor="#999"
                value={form.model}
                onChangeText={(text) => updateForm('model', text)}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={50}
                editable={!loading}
              />
              {errors.model ? (
                <Text style={styles.errorText}>{errors.model}</Text>
              ) : null}
            </View>

            {/* Campo Año */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Año</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.year ? styles.inputError : null,
                ]}
                placeholder="Ej: 2023"
                placeholderTextColor="#999"
                value={form.year}
                onChangeText={(text) => updateForm('year', text)}
                keyboardType="number-pad"
                maxLength={4}
                editable={!loading}
              />
              {errors.year ? (
                <Text style={styles.errorText}>{errors.year}</Text>
              ) : null}
            </View>

            {/* Campo Color */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Color</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.color ? styles.inputError : null,
                ]}
                placeholder="Ej: Rojo"
                placeholderTextColor="#999"
                value={form.color}
                onChangeText={(text) => updateForm('color', text)}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={30}
                editable={!loading}
              />
              {errors.color ? (
                <Text style={styles.errorText}>{errors.color}</Text>
              ) : null}
            </View>

            {/* Campo VIN */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>VIN (Número de chasis)</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.vin ? styles.inputError : null,
                ]}
                placeholder="Ej: 1HGBH41JXMN109186"
                placeholderTextColor="#999"
                value={form.vin}
                onChangeText={(text) => updateForm('vin', text)}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={17}
                editable={!loading}
              />
              {errors.vin ? (
                <Text style={styles.errorText}>{errors.vin}</Text>
              ) : null}
              <Text style={styles.helperText}>
                El VIN es un número de 17 caracteres único para cada vehículo
              </Text>
            </View>

            <View style={styles.inputContainer}>

            {/* Area de imagen */}
            <Text style={styles.label}>Imagen del Coche (Opcional)</Text>
            
            <TouchableOpacity 
              style={styles.imageContainer}
              onPress={handleSelectImagePress}
              disabled={loading}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>🚗</Text>
                  <Text style={styles.imagePlaceholderSubtext}>
                    {loading ? 'Cargando...' : 'Tocar para agregar imagen'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            {image && (
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={removeImage}
                disabled={loading}
              >
                <Text style={styles.removeImageButtonText}>✕ Eliminar Imagen</Text>
              </TouchableOpacity>
            )}
          </View>


            {/* Botón de Crear */}
            <TouchableOpacity
              style={[
                styles.createButton,
                loading ? styles.createButtonDisabled : null,
              ]}
              onPress={handleCreateCar}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.createButtonText}>Crear y Vincular Coche</Text>
              )}
            </TouchableOpacity>

            {/* Información adicional */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>💡 Información</Text>
              <Text style={styles.infoText}>
                • Los campos marcados con * son obligatorios{'\n'}
                • La matrícula debe ser única en el sistema{'\n'}
                • El VIN es opcional pero debe ser único si se proporciona{'\n'}
                • El coche se vinculará automáticamente a tu cuenta
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

      {/* Modal para seleccionar opciones (SOLO EN MÓVIL) */}
      {Platform.OS !== 'web' && (
        <Modal
          visible={showImageOptions}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowImageOptions(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Seleccionar Imagen</Text>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleImagePickMobile}  // Usa la funcion movil
              >
                <Text style={styles.modalOptionText}>📁 Elegir de la Galería</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleTakePhotoMobile}  // Usa la funcion movil
              >
                <Text style={styles.modalOptionText}>📸 Tomar Foto</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowImageOptions(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  createButtonDisabled: {
    backgroundColor: '#84BFFF',
  },
  createButtonText: {
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

  imageContainer: {
  width: '100%',
  height: 200,
  borderRadius: 12,
  backgroundColor: '#f0f0f0',
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: '#e9ecef',
  marginBottom: 8,
},
image: {
  width: '100%',
  height: '100%',
},
imagePlaceholder: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
},
imagePlaceholderText: {
  fontSize: 50,
  color: '#999',
  marginBottom: 10,
},
imagePlaceholderSubtext: {
  fontSize: 14,
  color: '#999',
  textAlign: 'center',
},
removeImageButton: {
  backgroundColor: '#FF3B30',
  padding: 10,
  borderRadius: 8,
  alignItems: 'center',
  alignSelf: 'flex-start',
},
removeImageButtonText: {
  color: 'white',
  fontSize: 14,
  fontWeight: '600',
},

modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'flex-end',
},
modalContent: {
  backgroundColor: 'white',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 20,
  paddingBottom: 40,
},
modalTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: 20,
  color: '#1a1a1a',
},
modalOption: {
  backgroundColor: '#f8f9fa',
  padding: 16,
  borderRadius: 12,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: '#e9ecef',
},
modalOptionText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#007AFF',
  textAlign: 'center',
},
modalCancelButton: {
  backgroundColor: '#6c757d',
  padding: 16,
  borderRadius: 12,
  alignItems: 'center',
  marginTop: 8,
},
modalCancelText: {
  color: 'white',
  fontSize: 16,
  fontWeight: '600',
},
});
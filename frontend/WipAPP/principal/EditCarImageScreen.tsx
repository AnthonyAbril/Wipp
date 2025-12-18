import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import * as ImagePicker from 'expo-image-picker';
import { imageAPI } from '../services/imageAPI';
import { SafeAreaView } from 'react-native-safe-area-context';
import { carAPI } from '../services/carAPI'; // Para recargar datos
import { showAlert } from '../utils/alerts';

type Props = StackScreenProps<RootStackParamList, 'EditCarImage'>;

export default function EditCarImageScreen({ navigation, route }: Props) {
  const { car } = route.params;
  const [loading, setLoading] = useState(false);
  const [displayImage, setDisplayImage] = useState<string | null>(car.car_image_url || car.car_image || null);
  const [hasNewImage, setHasNewImage] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Función para seleccionar imagen en web
  const handleImagePickWeb = (): Promise<File | null> => {
    return new Promise((resolve) => {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async (event: any) => {
        const file = event.target.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        
        // Validar tamaño
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          Alert.alert('Error', 'La imagen es demasiado grande. Máximo 5MB.');
          resolve(null);
          return;
        }
        
        // Crear URL para previsualización
        const imageUri = URL.createObjectURL(file);
        setDisplayImage(imageUri);
        setSelectedFile(file);
        setHasNewImage(true); // ← AÑADE ESTA LÍNEA
        resolve(file);
      };
        
        input.click();
      } catch (error) {
        console.error('Error en selector web:', error);
        Alert.alert('Error', 'No se pudo seleccionar la imagen');
        resolve(null);
      }
    });
  };



  // Función para seleccionar imagen en móvil
  const pickImage = async () => {
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
      setDisplayImage(result.assets[0].uri);
      setSelectedFile(null);
      setHasNewImage(true); // ← AÑADE ESTA LÍNEA
      setShowOptions(false);
    }
  };

  const takePhoto = async () => {
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
      setDisplayImage(result.assets[0].uri);
      setSelectedFile(null);
      setHasNewImage(true);
      setShowOptions(false);
    }
  };

  // Actualiar la imagen de un coche
  const uploadImage = async () => {
    // Verificar si hay una nueva imagen seleccionada
    if (!hasNewImage) {
      showAlert.error('Debes seleccionar una imagen primero');
      return;
    }

    setLoading(true);
    try {
      let fileToUpload: string | File;
      
      if (Platform.OS === 'web' && selectedFile) {
        fileToUpload = selectedFile;
      } else if (Platform.OS !== 'web' && displayImage && displayImage !== (car.car_image_url || car.car_image)) {
        // Verificar que es una imagen nueva (no la original)
        fileToUpload = displayImage;
      } else {
        throw new Error('No se pudo determinar la imagen a subir');
      }
      
      // ✅ Usar imageAPI.uploadCarImage unificada
      await imageAPI.uploadCarImage(car.id, fileToUpload);

      showAlert.success('Imagen del coche actualizada correctamente'); 
      
      // Resetear el estado de nueva imagen
      setHasNewImage(false);
      
      // Navegar de vuelta con parámetro refresh
      navigation.navigate('CarHome', { 
        car: { 
          ...car, 
          car_image: displayImage,
          updatedAt: new Date().toISOString()
        },
        refresh: true 
      } as any);
      
    } catch (error: any) {
      console.error('❌ Detalles del error:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      
      let errorMessage = 'No se pudo subir la imagen';
      
      // Mejorar los mensajes de error
      if (error.message.includes('Error de validación')) {
        errorMessage = 'La imagen debe ser JPG, PNG o GIF y pesar menos de 2MB';
      } else if (error.message.includes('500')) {
        errorMessage = 'Error en el servidor. Inténtalo de nuevo más tarde.';
      }
      
      Alert.alert('❌ Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = async () => {
    showAlert.confirm(
      'Eliminar Imagen',
      '¿Estás seguro de que quieres eliminar la imagen de este coche?',
      async () => {
        setLoading(true);
        try {
          await imageAPI.deleteCarImage(car.id);
          setDisplayImage(null);
          setSelectedFile(null);
          setHasNewImage(false);
          showAlert.success('Imagen del coche eliminada');
        } catch (error: any) {
          console.error('Error deleting car image:', error);
          showAlert.error(error.message || 'No se pudo eliminar la imagen');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Imagen del Coche</Text>
        <Text style={styles.subtitle}>{car.license_plate}</Text>

        {/* Vista previa de la imagen */}
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={() => {
            if (Platform.OS === 'web') {
              handleImagePickWeb();
            } else {
              setShowOptions(true);
            }
          }}
          disabled={loading}
        >
          {displayImage ? (
            <View style={styles.imageWrapper}>
              <Image 
                source={{ uri: displayImage }} 
                style={styles.image} 
                resizeMode="cover"
              />
              {hasNewImage && (
                <View style={styles.newImageBadge}>
                  <Text style={styles.newImageBadgeText}>NUEVA</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>🚗</Text>
              <Text style={styles.placeholderSubtext}>
                {Platform.OS === 'web' ? 'Haz clic para seleccionar imagen' : 'Toca para seleccionar imagen'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Botones de acción */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.button, 
              styles.primaryButton, 
              (!hasNewImage || loading) && styles.disabledButton
            ]}
            onPress={uploadImage}
            disabled={!hasNewImage || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {hasNewImage ? 'Guardar Nueva Imagen' : 'Sin cambios para guardar'}
              </Text>
            )}
          </TouchableOpacity>

          {displayImage && (
            <TouchableOpacity
              style={[styles.button, styles.removeButton]}
              onPress={removeImage}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Eliminar Imagen</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal para seleccionar origen (solo móvil) */}
      {Platform.OS !== 'web' && (
        <Modal
          visible={showOptions}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowOptions(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Seleccionar Imagen del Coche</Text>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={pickImage}
              >
                <Text style={styles.modalOptionText}>📁 Elegir de la Galería</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={takePhoto}
              >
                <Text style={styles.modalOptionText}>📸 Tomar Foto del Coche</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowOptions(false)}
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
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    maxWidth: 300,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginBottom: 40,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 50,
    color: '#999',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  disabledButton: {
    backgroundColor: '#84BFFF',
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
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

  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  newImageBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newImageBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
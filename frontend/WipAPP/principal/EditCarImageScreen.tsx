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
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import * as ImagePicker from 'expo-image-picker';
import { imageAPI } from '../services/imageAPI';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = StackScreenProps<RootStackParamList, 'EditCarImage'>;

export default function EditCarImageScreen({ navigation, route }: Props) {
  const { car } = route.params;
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(car.car_image || null);
  const [showOptions, setShowOptions] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para seleccionar una imagen');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 2], // Proporción más adecuada para coches
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
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
      aspect: [3, 2],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setShowOptions(false);
    }
  };

  const uploadImage = async () => {
    if (!image) {
      Alert.alert('Error', 'Debes seleccionar una imagen primero');
      return;
    }

    setLoading(true);
    try {
      await imageAPI.uploadCarImage(car.id, image);
      Alert.alert('✅ Éxito', 'Imagen del coche actualizada correctamente');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error uploading car image:', error);
      Alert.alert('❌ Error', error.message || 'No se pudo subir la imagen');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = async () => {
    setLoading(true);
    try {
      await imageAPI.deleteCarImage(car.id);
      setImage(null);
      Alert.alert('✅ Éxito', 'Imagen del coche eliminada');
    } catch (error: any) {
      console.error('Error deleting car image:', error);
      Alert.alert('❌ Error', error.message || 'No se pudo eliminar la imagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Imagen del Coche</Text>
        <Text style={styles.subtitle}>{car.license_plate}</Text>

        {/* Vista previa de la imagen */}
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={() => setShowOptions(true)}
          disabled={loading}
        >
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>🚗</Text>
              <Text style={styles.placeholderSubtext}>Seleccionar imagen del coche</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Botones de acción */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={uploadImage}
            disabled={loading || !image}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Guardar Imagen</Text>
            )}
          </TouchableOpacity>

          {image && (
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

      {/* Modal para seleccionar origen */}
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
    width: 300,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginBottom: 40,
    overflow: 'hidden',
    borderWidth: 3,
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
  },
  placeholderText: {
    fontSize: 50,
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
    marginTop: 20,
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
});
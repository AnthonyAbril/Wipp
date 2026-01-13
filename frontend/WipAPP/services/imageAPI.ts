import { Platform } from 'react-native';
import { API_BASE_URL, getAuthHeaders } from './api';

export const imageAPI = {
  // Subir imagen de perfil
  uploadProfileImage: async (imageUri: string): Promise<any> => {
    try {
      const formData = new FormData();
      
      // Extraer el nombre del archivo de la URI
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('profile_image', {
        uri: imageUri,
        name: filename || 'profile.jpg',
        type,
      } as any);

      const response = await fetch(`${API_BASE_URL}/user/profile-image`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeaders().Authorization,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al subir imagen');
      }
      
      return data;
      
    } catch (error: any) {
      console.error('❌ Error al subir imagen de perfil:', error);
      throw error;
    }
  },

  // Subir imagen de coche
  uploadCarImage: async (carId: number, imageUri: string | File): Promise<any> => {
    try {
      const formData = new FormData();
      
      if (Platform.OS === 'web' && imageUri instanceof File) {
        // Para web: File object
        formData.append('car_image', imageUri);
      } else if (typeof imageUri === 'string') {
        // Para móvil: URI de React Native
        const filename = imageUri.split('/').pop() || 'car_image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('car_image', {
          uri: imageUri,
          name: filename,
          type: type,
        } as any);
      } else {
        throw new Error('Tipo de imagen no soportado');
      }
      
      // ✅ RUTA CORRECTA
      console.log("Coche ID: "+carId+"\nAPI BASE: "+API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/cars/${carId}/image`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeaders().Authorization,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al subir la imagen');
      }
      
      return data;
      
    } catch (error: any) {
      console.error('❌ Error al subir imagen:', error);
      throw error;
    }
  },

  // Eliminar imagen de perfil
  deleteProfileImage: async (): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile-image`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar imagen');
      }
      
      return data;
      
    } catch (error: any) {
      console.error('❌ Error al eliminar imagen de perfil:', error);
      throw error;
    }
  },

  // Eliminar imagen de coche
  deleteCarImage: async (carId: number): Promise<any> => {
    try {
      // ✅ RUTA CORRECTA
      const response = await fetch(`${API_BASE_URL}/cars/${carId}/image`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar la imagen');
      }
      return data;
      
    } catch (error: any) {
      console.error('❌ Error al eliminar imagen:', error);
      throw error;
    }
  },
};
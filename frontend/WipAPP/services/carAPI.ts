import { Platform } from 'react-native';
import { API_BASE_URL, getAuthHeaders } from './api';

export const carAPI = {
  getUserCars: async (): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars/user`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener coches');
      }
      
      return data;
      
    } catch (error: any) {
      console.error('❌ Error al obtener coches:', error);
      throw error;
    }
  },

  createCar: async (carData: any): Promise<any> => {
    try {
      const formData = new FormData();
    
      // Campos obligatorios
      formData.append('license_plate', carData.license_plate);
      formData.append('pin_code', carData.pin_code);
      
      // Campos opcionales
      if (carData.brand) formData.append('brand', carData.brand);
      if (carData.model) formData.append('model', carData.model);
      if (carData.year) formData.append('year', carData.year.toString());
      if (carData.color) formData.append('color', carData.color);
      if (carData.vin) formData.append('vin', carData.vin);
      
      // Manejo de imagen - versión simplificada
      if (carData._car_image_file) {
        // WEB: Si existe _car_image_file (File object)
        formData.append('car_image', carData._car_image_file);
      } 
      else if (carData.car_image && typeof carData.car_image === 'string' && carData.car_image.startsWith('file://')) {
        // MÓVIL: URI de React Native
        const uri = carData.car_image;
        const filename = uri.split('/').pop() || 'car_image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('car_image', {
          uri: uri,
          name: filename,
          type: type,
        } as any);
      }
      else if (Platform.OS === 'web' && carData.car_image instanceof Blob) {
        // WEB alternativo: Blob/File
        formData.append('car_image', carData.car_image);
      }
      
      const response = await fetch(`${API_BASE_URL}/cars/create`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeaders().Authorization,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          throw new Error(JSON.stringify(data));
        }
        throw new Error(data.message || 'Error al crear coche');
      }
      
      return data;
      
    } catch (error: any) {
      console.error('❌ Error al crear coche:', error);
      throw error;
    }
  },

  // Alternativa: función general de actualización de coche
  updateCar: async (carId: number, carData: any): Promise<any> => {
    try {
      const formData = new FormData();
      
      // Solo incluir campos que se quieran actualizar
      Object.keys(carData).forEach(key => {
        if (carData[key] !== undefined && carData[key] !== null) {
          if (key === '_car_image_file' && carData[key]) {
            formData.append('car_image', carData[key]);
          } else if (key !== '_car_image_file' && key !== 'car_image') {
            formData.append(key, carData[key]);
          }
        }
      });
      
      const response = await fetch(`${API_BASE_URL}/cars/${carId}`, {
        method: 'POST', // o 'PUT' según tu backend
        headers: {
          'Authorization': getAuthHeaders().Authorization,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar coche');
      }
      
      return data;
      
    } catch (error: any) {
      console.error('❌ Error al actualizar coche:', error);
      throw error;
    }
  },

  linkCar: async (licensePlate: string, pinCode: string): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars/link`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          license_plate: licensePlate,
          pin_code: pinCode,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al vincular coche');
      }
      
      return data;
      
    } catch (error: any) {
      console.error('❌ Error al vincular coche:', error);
      throw error;
    }
  },

  setLastUsedCar: async (carId: number): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars/${carId}/last-used`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar último coche');
      }
      
      return data;
      
    } catch (error: any) {
      console.error('❌ Error al actualizar último coche:', error);
      throw error;
    }
  },

  setPrimaryCar: async (carId: number): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars/${carId}/primary`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al establecer coche principal');
      }
      
      return data;
      
    } catch (error: any) {
      console.error('❌ Error al establecer coche principal:', error);
      throw error;
    }
  }
};
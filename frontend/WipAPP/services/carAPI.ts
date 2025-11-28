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
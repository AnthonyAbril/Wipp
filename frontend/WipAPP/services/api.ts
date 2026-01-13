import Constants from 'expo-constants';

const isDevelopment = __DEV__;
//const localIP = '192.168.1.14'; // IP de casa
//const localIP = '192.168.56.1'; // IP de datos
const localIP = '192.168.1.23'; //IP para usar en el movil

export const API_BASE_URL = isDevelopment 
  ? `http://${localIP}:8000/api`
  : 'https://tu-api-en-produccion.com/api'; // Para producción
  
// Interceptor para manejar tokens
let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
};

export const getAuthToken = () => {
  return authToken;
};

// Headers comunes
export const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`,
});
import { API_BASE_URL, setAuthToken, getAuthHeaders } from './api';

export const authAPI = {
  login: async (email: string, password: string): Promise<any> => {
    try {
      console.log('🔗 Conectando a:', `${API_BASE_URL}/login`);
      
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Error en login:', data);
        
        if (response.status === 401) {
          throw new Error('Las credenciales proporcionadas son incorrectas.');
        } else if (response.status === 422 && data.errors) {
          const firstError = Object.values(data.errors)[0] as string[];
          throw new Error(firstError[0] || 'Error de validación');
        } else {
          throw new Error(data.message || 'Error en el servidor');
        }
      }
      
      if (data.data.access_token) {
        setAuthToken(data.data.access_token);
        console.log('✅ Token guardado');
      }
      
      console.log('✅ Login exitoso');
      return data;
      
    } catch (error: any) {
      console.error('❌ Error de conexión:', error.message);
      if (error.message.includes('Network request failed')) {
        throw new Error('No se pudo conectar al servidor. Verifica tu conexión.');
      }
      throw error;
    }
  },

  register: async (name: string, email: string, password: string, passwordConfirmation: string): Promise<any> => {
    try {
      console.log('🔗 Conectando a:', `${API_BASE_URL}/register`);
      
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          password_confirmation: passwordConfirmation 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Error en registro:', data);
        
        if (response.status === 422 && data.errors) {
          const errorFields = Object.keys(data.errors);
          if (errorFields.length > 0) {
            const firstError = data.errors[errorFields[0]] as string[];
            throw new Error(firstError[0] || 'Error de validación');
          }
        }
        
        throw new Error(data.message || 'Error en el registro');
      }
      
      if (data.data.access_token) {
        setAuthToken(data.data.access_token);
      }
      
      console.log('✅ Registro exitoso');
      return data;
      
    } catch (error: any) {
      console.error('❌ Error de conexión:', error.message);
      if (error.message.includes('Network request failed')) {
        throw new Error('No se pudo conectar al servidor. Verifica tu conexión.');
      }
      throw error;
    }
  },

  getUser: async (): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener usuario');
      }
      
      return data;
      
    } catch (error: any) {
      console.error('❌ Error al obtener usuario:', error);
      throw error;
    }
  },

  logout: async (): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      
      setAuthToken('');
      
      return response.json();
      
    } catch (error: any) {
      console.error('❌ Error al cerrar sesión:', error);
      throw error;
    }
  }
};
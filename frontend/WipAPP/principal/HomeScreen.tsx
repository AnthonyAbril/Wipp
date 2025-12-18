import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { authAPI } from '../services/authAPI';
import { useFocusEffect } from '@react-navigation/native';
import { carAPI } from '../services/carAPI';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = StackScreenProps<RootStackParamList, 'Home'>;

interface User {
  id: number;
  name: string;
  email: string;
}

interface Car {
  id: number;
  license_plate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  pivot?: {
    is_primary: boolean;
    last_used_at: string | null;
  };
}

export default function HomeScreen({ navigation }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [primaryCar, setPrimaryCar] = useState<Car | null>(null);
  const [lastUsedCar, setLastUsedCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCarOptions, setShowCarOptions] = useState(false);

  // Función para cargar coches
  const loadCars = async () => {
    try {
      setRefreshing(true);
      const response = await carAPI.getUserCars();
      if (response.success && response.data.cars) {
        setCars(response.data.cars);
      }
    } catch (error) {
      console.error('Error loading cars:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Cargar coches al montar el componente
  useEffect(() => {
    loadCars();
  }, []);

  // Recargar cuando la pantalla reciba foco
  useFocusEffect(
    useCallback(() => {
      loadCars();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const [userResponse, carsResponse] = await Promise.all([
        authAPI.getUser(),
        carAPI.getUserCars()
      ]);
      
      console.log('🚗 Respuesta coches:', carsResponse.data);
      
      setUser(userResponse.data.user);
      const carsData = carsResponse.data.cars || [];
      setCars(carsData);
      
      // Coches ordenados: primero principal, luego por último uso
      const sortedCars = [...carsData].sort((a, b) => {
        // Primero, ordenar por si es principal
        const aIsPrimary = a.pivot?.is_primary ? 1 : 0;
        const bIsPrimary = b.pivot?.is_primary ? 1 : 0;
        
        if (aIsPrimary !== bIsPrimary) {
          return bIsPrimary - aIsPrimary; // Principal primero
        }
        
        // Luego, ordenar por last_used_at (más reciente primero)
        const aTime = a.pivot?.last_used_at ? new Date(a.pivot.last_used_at).getTime() : 0;
        const bTime = b.pivot?.last_used_at ? new Date(b.pivot.last_used_at).getTime() : 0;
        return bTime - aTime;
      });
      
      setCars(sortedCars);
      
      // Encontrar coche principal
      const primary = sortedCars.find(car => car.pivot?.is_primary) || sortedCars[0] || null;
      setPrimaryCar(primary);
      
      // Encontrar último coche usado
      const lastUsed = sortedCars.length > 0 ? sortedCars[0] : null;
      setLastUsedCar(lastUsed);
      
      console.log('⭐ Coche principal:', primary?.license_plate);
      console.log('🕐 Último coche usado:', lastUsed?.license_plate);
      
    } catch (error: any) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  /* Redirección automática al último coche usado
  useEffect(() => {
    const checkLastUsedCar = async () => {
      try {
        const carsResponse = await carAPI.getUserCars();
        const carsData = carsResponse.data.cars || [];
        
        if (carsData.length > 0) {
          // Ordenar por last_used_at para encontrar el más reciente
          const sortedByLastUsed = [...carsData].sort((a, b) => {
            const aTime = a.pivot?.last_used_at ? new Date(a.pivot.last_used_at).getTime() : 0;
            const bTime = b.pivot?.last_used_at ? new Date(b.pivot.last_used_at).getTime() : 0;
            return bTime - aTime;
          });
          
          const mostRecentCar = sortedByLastUsed[0];
          
          // Solo redirigir si hay un último coche usado válido
          if (mostRecentCar && mostRecentCar.pivot?.last_used_at) {
            console.log('🔄 Redirigiendo al último coche usado:', mostRecentCar.license_plate);
            navigation.navigate('CarHome', { car: mostRecentCar });
          }
        }
      } catch (error) {
        console.error('Error al verificar último coche:', error);
      }
    };
    
    // Ejecutar solo al montar el componente
    checkLastUsedCar();
  }, []);
  */

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const handleOpenCar = async (car: Car) => {
    try {
      // Marcar como último coche usado
      await carAPI.setLastUsedCar(car.id);
      setLastUsedCar(car);
      
      // Navegar a la pantalla del coche
      navigation.navigate('CarHome', { car });
      
    } catch (error: any) {
      console.error('Error al abrir coche:', error);
      Alert.alert('Error', 'No se pudo abrir el coche');
    }
  };

  const handleSetPrimaryCar = async (car: Car) => {
    try {
      await carAPI.setPrimaryCar(car.id);
      setPrimaryCar(car);
      
      // Actualizar lista de coches - VERSIÓN COMPLETAMENTE CORREGIDA
      const updatedCars = cars.map(c => {
        // Crear una copia segura del coche
        const currentCar = { ...c };
        
        // Asegurarnos de que pivot existe
        if (!currentCar.pivot) {
          currentCar.pivot = {
            is_primary: false,
            last_used_at: null
          };
        }
        
        // Si este es el coche que se hizo principal
        if (currentCar.id === car.id) {
          return {
            ...currentCar,
            pivot: {
              ...currentCar.pivot,
              is_primary: true
            }
          };
        }
        
        // Si era el coche principal anterior
        if (currentCar.pivot.is_primary) {
          return {
            ...currentCar,
            pivot: {
              ...currentCar.pivot,
              is_primary: false
            }
          };
        }
        
        return currentCar;
      });
      
      // Reordenar coches: principal primero
      const sortedCars = [...updatedCars].sort((a, b) => {
        const aIsPrimary = a.pivot?.is_primary ? 1 : 0;
        const bIsPrimary = b.pivot?.is_primary ? 1 : 0;
        return bIsPrimary - aIsPrimary;
      });
      
      setCars(sortedCars);
      
      Alert.alert('✅ Éxito', `${car.license_plate} establecido como coche principal`);
    } catch (error: any) {
      console.error('Error al establecer coche principal:', error);
      Alert.alert('❌ Error', 'No se pudo establecer como coche principal');
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      navigation.navigate('Login');
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      navigation.navigate('Login');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header del Usuario */}
        <View style={styles.header}>
          <View style={styles.profileImage} />
          <Text style={styles.title}>¡Bienvenido, {user?.name}! 👋</Text>
          <Text style={styles.subtitle}>{user?.email}</Text>
          
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Sección de Coches */}
        <View style={styles.carsSection}>
          <Text style={styles.sectionTitle}>Mis Coches</Text>
          
          {cars.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No tienes coches vinculados</Text>
              <Text style={styles.emptyStateText}>
                Añade tu primer coche para empezar
              </Text>
            </View>
          ) : (
            <View style={styles.carsContainer}>
              {cars.map(car => (
                <CarCard
                  key={car.id}
                  car={car}
                  onPress={() => handleOpenCar(car)}
                  onSetPrimary={() => handleSetPrimaryCar(car)}
                  isPrimary={car.pivot?.is_primary || false}
                />
              ))}
            </View>
          )}
        </View>

        {/* Botón para añadir coche */}
        <TouchableOpacity
          style={styles.addCarButton}
          onPress={() => setShowCarOptions(true)}
        >
          <Text style={styles.addCarButtonText}>+ Añadir Coche</Text>
        </TouchableOpacity>

        {/* Modal de opciones para añadir coche */}
        <Modal
          visible={showCarOptions}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCarOptions(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Añadir Coche</Text>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setShowCarOptions(false);
                  navigation.navigate('LinkCar');
                }}
              >
                <Text style={styles.modalOptionText}>🔗 Vincular Coche Existente</Text>
                <Text style={styles.modalOptionSubtext}>
                  Usa matrícula y PIN de un coche ya registrado
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setShowCarOptions(false);
                  navigation.navigate('CreateCar');
                }}
              >
                <Text style={styles.modalOptionText}>🚗 Crear Nuevo Coche</Text>
                <Text style={styles.modalOptionSubtext}>
                  Registra un coche nuevo en el sistema
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCarOptions(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

// Componente CarCard simplificado
interface CarCardProps {
  car: Car;
  onPress: () => void;
  onSetPrimary: () => void;
  isPrimary: boolean;
}

const CarCard = ({ car, onPress, onSetPrimary, isPrimary }: CarCardProps) => {
  const getTimeAgo = (dateString: string | null): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `hace ${interval} año${interval > 1 ? 's' : ''}`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `hace ${interval} mes${interval > 1 ? 'es' : ''}`;
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `hace ${interval} día${interval > 1 ? 's' : ''}`;
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `hace ${interval} hora${interval > 1 ? 's' : ''}`;
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `hace ${interval} minuto${interval > 1 ? 's' : ''}`;
    
    return 'hace unos segundos';
  };

  return (
    <TouchableOpacity 
      style={styles.carCard}
      onPress={onPress}
    >
      <View style={styles.carInfo}>
        <View style={styles.carHeader}>
          <Text style={styles.carLicensePlate}>
            🚗 {car.license_plate} {isPrimary && '⭐'}
          </Text>
        </View>
        
        <Text style={styles.carDetails}>
          {car.brand} {car.model} {car.year && `• ${car.year}`}
        </Text>
        {car.color && (
          <Text style={styles.carColor}>Color: {car.color}</Text>
        )}
      </View>
      
      <View style={styles.timeAndActions}>
        {car.pivot?.last_used_at && (
          <Text style={styles.lastUsedText}>
            {getTimeAgo(car.pivot.last_used_at)}
          </Text>
        )}
        <View style={styles.carActions}>
          {!isPrimary && (
            <TouchableOpacity 
              style={styles.primaryAction}
              onPress={(e) => {
                e.stopPropagation();
                onSetPrimary();
              }}
            >
              <Text style={styles.primaryActionText}>⭐ Principal</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    paddingVertical: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  profileImage: {
    backgroundColor: '#007AFF',
    height: 80,
    width: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  carsSection: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  carsContainer: {
    gap: 12,
  },
  carHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  carLicensePlate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  carDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  carColor: {
    fontSize: 12,
    color: '#888',
  },
  primaryAction: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  primaryActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  addCarButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
  },
  addCarButtonText: {
    color: 'white',
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
    marginBottom: 4,
  },
  modalOptionSubtext: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
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

  timeAndActions: {
    alignItems: 'flex-end',
  },
  lastUsedText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  
  carCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 100, // Altura mínima para mejor apariencia
  },
  
  // Ajustar carInfo para tomar más espacio:
  carInfo: {
    flex: 2, // Toma más espacio
  },
  
  // Ajustar carActions:
  carActions: {
    marginLeft: 12,
  },
});
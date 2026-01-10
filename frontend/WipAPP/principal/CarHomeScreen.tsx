import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { carAPI } from '../services/carAPI';
import { API_BASE_URL } from '../services/api';

type Props = StackScreenProps<RootStackParamList, 'CarHome'>;

interface Car {
  id: number;
  license_plate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  vin: string | null;
  car_image: string | null;
  car_image_url?: string | null;
  pivot?: {
    is_primary: boolean;
    last_used_at: string | null;
  };
}

interface CarInfo {
  title: string;
  value: string;
  icon: string;
}

export default function CarHomeScreen({ route, navigation }: Props) {
  // ✅ Extraer parámetros con valor por defecto
  const { car: initialCar, refresh = false, carId, timestamp } = route.params || {};
  
  // ✅ Inicializar con objeto vacío o con valores por defecto
  const [car, setCar] = useState<Car | null>(initialCar || null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [carLoaded, setCarLoaded] = useState(false);

  // Ref para evitar múltiples llamadas
  const lastRefreshTime = useRef<number>(0);
  const isMounted = useRef(true);

  // ✅ Inicializar con valores por defecto si no hay car
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;
    
    const shouldRefresh = refresh || timestamp;
    
    if (shouldRefresh) {
      // Evitar refrescar si ya se refrescó recientemente
      const now = Date.now();
      if (now - lastRefreshTime.current > 1000) {
        lastRefreshTime.current = now;
        loadCarData();
      }
      
      // Limpiar params después de usar
      setTimeout(() => {
        if (isMounted.current) {
          navigation.setParams({ 
            refresh: false,
            timestamp: undefined 
          } as any);
        }
      }, 100);
    }
  }, [refresh, timestamp, navigation]);

  // ✅ useFocusEffect optimizado
  useFocusEffect(
    useCallback(() => {
      isMounted.current = true;
      
      // Cargar datos si no están cargados o si necesitamos refrescar
      if (!carLoaded || refresh) {
        loadCarData();
      }
      
      return () => {
        isMounted.current = false;
      };
    }, [carLoaded, refresh])
  );

  // ✅ Función para cargar datos del coche
  const loadCarData = async (force = false) => {
    if ((loading || refreshing) && !force) return;
    if (!isMounted.current) return;
    
    try {
      setLoading(true);
      const response = await carAPI.getUserCars();
      
      if (response.success && response.data.cars) {
        const carsData = response.data.cars;
        
        // Encontrar el coche actual
        const targetCarId = carId || car?.id || initialCar?.id;
        const currentCar = carsData.find((c: Car) => c.id === targetCarId);
        
        if (currentCar) {
          // ✅ Asegurar URL completa de imagen
          const carWithImage = {
            ...currentCar,
            car_image_url: currentCar.car_image_url || 
                         (currentCar.car_image ? 
                          `${API_BASE_URL}/storage/${currentCar.car_image.replace(/^public\//, '')}` : 
                          null)
          };
          
          setCar(carWithImage);
          setCarLoaded(true);
          
          // ✅ Marcar como último coche usado
          try {
            await carAPI.setLastUsedCar(carWithImage.id);
          } catch (error) {
            console.error('Error al marcar como último usado:', error);
          }
          
          // ✅ Actualizar navegación si venimos de edición
          if (refresh || timestamp) {
            navigation.setParams({ 
              car: carWithImage,
              refresh: false,
              timestamp: undefined 
            } as any);
          }
        } else {
          // ❌ No se encontró el coche
          Alert.alert('Error', 'No se encontró el coche solicitado');
          navigation.goBack();
        }
      }
    } catch (error: any) {
      console.error('Error loading car data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del coche');
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCarData(true);
  };

  // ✅ Verificar si hay datos antes de renderizar
  if (!car && loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando datos del coche...</Text>
      </SafeAreaView>
    );
  }

  // ✅ Si no hay coche después de cargar
  if (!car && !loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>No se encontró el coche</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>← Volver a Mis Coches</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ✅ Preparar información del coche para mostrar
  const carInfo = [
    { title: 'Matrícula', value: car!.license_plate, icon: '🔢' },
    { title: 'Marca', value: car!.brand || 'No especificada', icon: '🏭' },
    { title: 'Modelo', value: car!.model || 'No especificado', icon: '🚙' },
    { title: 'Año', value: car!.year?.toString() || 'No especificado', icon: '📅' },
    { title: 'Color', value: car!.color || 'No especificado', icon: '🎨' },
    { title: 'VIN', value: car!.vin || 'No especificado', icon: '🔑' },
  ];

  const handleSetPrimary = async () => {
    try {
      await carAPI.setPrimaryCar(car!.id);
      Alert.alert('✅ Éxito', `${car!.license_plate} establecido como coche principal`);
      loadCarData(true); // Recargar datos
    } catch (error: any) {
      console.error('Error setting primary car:', error);
      Alert.alert('❌ Error', 'No se pudo establecer como coche principal');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header del Coche */}
        <View style={styles.header}>
          {/* Imagen del coche */}
          <TouchableOpacity 
            style={styles.carImageContainer}
            onPress={() => {
              navigation.navigate('EditCarImage', { car: car! });
            }}
            activeOpacity={0.7}
          >
            {car!.car_image_url || car!.car_image ? (
              <Image 
                source={{ 
                  uri: car!.car_image_url || 
                       (car!.car_image ? 
                        `${API_BASE_URL}/storage/${car!.car_image}` : 
                        '')
                }} 
                style={styles.carImage}
                resizeMode="cover"
                onError={(e) => {
                  console.log("Error cargando imagen:", e.nativeEvent.error);
                }}
              />
            ) : (
              <View style={styles.carImagePlaceholder}>
                <Text style={styles.carImagePlaceholderText}>🚗</Text>
                <Text style={styles.carImagePlaceholderSubtext}>
                  Tocar para agregar imagen
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <Text style={styles.title}>{car!.license_plate}</Text>
          
          {car!.pivot?.is_primary && (
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>⭐ Principal</Text>
            </View>
          )}

          <Text style={styles.subtitle}>
            {car!.brand} {car!.model} {car!.year && `• ${car!.year}`}
          </Text>
        </View>

        {/* Información del Coche */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Información del Coche</Text>
          {carInfo.map((item, index) => (
            <View key={index} style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.infoIcon}>{item.icon}</Text>
                <Text style={styles.infoLabel}>{item.title}</Text>
              </View>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Acciones */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          
          {!car!.pivot?.is_primary && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleSetPrimary}
            >
              <Text style={styles.actionButtonText}>⭐ Establecer como Principal</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={() => navigation.navigate('EditCarImage', { car: car! })}
          >
            <Text style={[styles.actionButtonText, styles.secondaryActionText]}>
              🖼️ {car!.car_image ? 'Cambiar Imagen' : 'Agregar Imagen'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
          >
            <Text style={[styles.actionButtonText, styles.secondaryActionText]}>
              📊 Ver Estadísticas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
          >
            <Text style={[styles.actionButtonText, styles.secondaryActionText]}>
              ⛽ Registrar Repostaje
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
          >
            <Text style={[styles.actionButtonText, styles.secondaryActionText]}>
              🔧 Mantenimiento
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botón para volver */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Home", { refresh: true } as any)}
        >
          <Text style={styles.backButtonText}>← Volver a Mis Coches</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  carIcon: {
    fontSize: 60,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  primaryBadge: {
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
    marginBottom: 12,
  },
  primaryBadgeText: {
    color: '#B8860B',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#ffffff',
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  actionsSection: {
    backgroundColor: '#ffffff',
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryAction: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  secondaryActionText: {
    color: '#333',
  },
  backButton: {
    backgroundColor: '#6c757d',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  carImageContainer: {
    width: 120,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  carImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  carImagePlaceholderText: {
    fontSize: 40,
    color: '#666',
  },
  carImagePlaceholderSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
});
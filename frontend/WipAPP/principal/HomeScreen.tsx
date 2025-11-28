import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { authAPI } from '../services/authAPI';
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

  const loadUserData = async () => {
    try {
      const [userResponse, carsResponse] = await Promise.all([
        authAPI.getUser(),
        carAPI.getUserCars()
      ]);
      
      setUser(userResponse.data.user);
      setCars(carsResponse.data.cars || []);
      setPrimaryCar(carsResponse.data.primary_car || null);
      setLastUsedCar(carsResponse.data.last_used_car || null);
      
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
      Alert.alert('Éxito', `${car.license_plate} establecido como coche principal`);
    } catch (error: any) {
      console.error('Error al establecer coche principal:', error);
      Alert.alert('Error', 'No se pudo establecer como coche principal');
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      navigation.navigate('Login');
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      // Forzar navegación al login incluso si hay error
      navigation.navigate('Login');
    }
  };

  const handleLinkCar = () => {
    navigation.navigate('LinkCar');
  };

  // Agrupar coches por categorías
  const getCarSections = () => {
    const sections = [];

    // Último coche usado
    if (lastUsedCar) {
      sections.push({
        title: 'Último Coche Usado',
        cars: [lastUsedCar],
        type: 'recent' as const,
      });
    }

    // Coche principal (si no es el mismo que el último usado)
    if (primaryCar && primaryCar.id !== lastUsedCar?.id) {
      sections.push({
        title: 'Coche Principal',
        cars: [primaryCar],
        type: 'primary' as const,
      });
    }

    // Todos los coches (excluyendo los ya mostrados)
    const remainingCars = cars.filter(car => 
      car.id !== lastUsedCar?.id && car.id !== primaryCar?.id
    );

    if (remainingCars.length > 0) {
      sections.push({
        title: 'Todos Mis Coches',
        cars: remainingCars,
        type: 'normal' as const,
      });
    }

    return sections;
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


        {/* Estadísticas Rápidas */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{cars.length}</Text>
            <Text style={styles.statLabel}>Coches</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {cars.filter(car => car.pivot?.is_primary).length}
            </Text>
            <Text style={styles.statLabel}>Principal</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {lastUsedCar ? 1 : 0}
            </Text>
            <Text style={styles.statLabel}>Reciente</Text>
          </View>
        </View>

        {/* Secciones de Coches */}
        {getCarSections().map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.cars.map(car => (
              <CarCard
                key={car.id}
                car={car}
                type={section.type}
                onPress={() => handleOpenCar(car)}
                onSetPrimary={() => handleSetPrimaryCar(car)}
                isPrimary={primaryCar?.id === car.id}
              />
            ))}
          </View>
        ))}

        {/* Mensaje si no hay coches */}
        {cars.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No tienes coches vinculados</Text>
            <Text style={styles.emptyStateText}>
              Vincula tu primer coche para empezar a gestionarlo
            </Text>
          </View>
        )}

        {/* Botón para vincular nuevo coche */}
        <TouchableOpacity
          style={styles.linkCarButton}
          onPress={handleLinkCar}
        >
          <Text style={styles.linkCarButtonText}>+ Vincular Nuevo Coche</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Componente CarCard
interface CarCardProps {
  car: Car;
  type: 'primary' | 'recent' | 'normal';
  onPress: () => void;
  onSetPrimary: () => void;
  isPrimary: boolean;
}

const CarCard = ({ car, type, onPress, onSetPrimary, isPrimary }: CarCardProps) => {
  const getBadgeText = () => {
    if (type === 'primary') return '⭐ Principal';
    if (type === 'recent') return '🕐 Último usado';
    return null;
  };

  const getTimeAgo = (date: string | null) => {
    if (!date) return '';
    
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'ahora mismo';
  };

  return (
    <TouchableOpacity 
      style={[styles.carCard, (styles as any)[`carCard_${type}`]]}
      onPress={onPress}
    >
      <View style={styles.carInfo}>
        <View style={styles.carHeader}>
          <Text style={styles.carLicensePlate}>🚗 {car.license_plate}</Text>
          {getBadgeText() && (
            <Text style={styles.carBadge}>{getBadgeText()}</Text>
          )}
        </View>
        
        <Text style={styles.carDetails}>
          {car.brand} {car.model} {car.year && `• ${car.year}`}
        </Text>
        
        {car.color && (
          <Text style={styles.carColor}>Color: {car.color}</Text>
        )}
        
        {type === 'recent' && car.pivot?.last_used_at && (
          <Text style={styles.lastUsed}>
            {getTimeAgo(car.pivot.last_used_at)}
          </Text>
        )}
      </View>
      
      <View style={styles.carActions}>
        {!isPrimary && (
          <TouchableOpacity 
            style={styles.primaryAction}
            onPress={(e) => {
              e.stopPropagation(); // Evitar que se active el onPress del card
              onSetPrimary();
            }}
          >
            <Text style={styles.primaryActionText}>⭐ Principal</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.carArrow}>→</Text>
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
    paddingHorizontal: 16,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    paddingLeft: 8,
  },
  carCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carCard_primary: {
    borderColor: '#FFD700',
    backgroundColor: '#FFF9E6',
  },
  carCard_recent: {
    borderColor: '#4CD964',
    backgroundColor: '#F0FFF4',
  },
  carInfo: {
    flex: 1,
  },
  carHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  carLicensePlate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  carBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  carDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  carColor: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  lastUsed: {
    fontSize: 12,
    color: '#4CD964',
    fontWeight: '500',
  },
  carActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  carArrow: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  linkCarButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 80,
    paddingBottom: 60
  },
  linkCarButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
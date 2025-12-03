import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { carAPI } from '../services/carAPI';

type Props = StackScreenProps<RootStackParamList, 'CarHome'>;

interface Car {
  id: number;
  license_plate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  vin: string | null;
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
  const { car: initialCar } = route.params;
  const [car, setCar] = useState<Car>(initialCar);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCarData = async () => {
    try {
      setLoading(true);
      const response = await carAPI.getUserCars();
      const carsData = response.data.cars || [];
      
      // Buscar el coche actual con datos actualizados
      const currentCar = carsData.find((c: Car) => c.id === car.id) || car;
      setCar(currentCar);
      
    } catch (error: any) {
      console.error('Error loading car data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del coche');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Marcar como último coche usado al entrar
    const markAsLastUsed = async () => {
      try {
        await carAPI.setLastUsedCar(car.id);
      } catch (error) {
        console.error('Error al marcar como último usado:', error);
      }
    };
    
    markAsLastUsed();
  }, [car.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCarData();
  };

  // Preparar información del coche para mostrar
  const carInfo: CarInfo[] = [
    { title: 'Matrícula', value: car.license_plate, icon: '🔢' },
    { title: 'Marca', value: car.brand || 'No especificada', icon: '🏭' },
    { title: 'Modelo', value: car.model || 'No especificado', icon: '🚙' },
    { title: 'Año', value: car.year?.toString() || 'No especificado', icon: '📅' },
    { title: 'Color', value: car.color || 'No especificado', icon: '🎨' },
    { title: 'VIN', value: car.vin || 'No especificado', icon: '🔑' },
  ];

  const handleSetPrimary = async () => {
    try {
      await carAPI.setPrimaryCar(car.id);
      Alert.alert('✅ Éxito', `${car.license_plate} establecido como coche principal`);
      navigation.goBack();
    } catch (error: any) {
      console.error('Error setting primary car:', error);
      Alert.alert('❌ Error', 'No se pudo establecer como coche principal');
    }
  };

  if (loading && !refreshing) {
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
        {/* Header del Coche */}
        <View style={styles.header}>
          <Text style={styles.carIcon}>🚗</Text>
          <Text style={styles.title}>{car.license_plate}</Text>
          {car.pivot?.is_primary && (
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>⭐ Principal</Text>
            </View>
          )}
          
          <Text style={styles.subtitle}>
            {car.brand} {car.model} {car.year && `• ${car.year}`}
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
          
          {!car.pivot?.is_primary && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleSetPrimary}
            >
              <Text style={styles.actionButtonText}>⭐ Establecer como Principal</Text>
            </TouchableOpacity>
          )}

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
          onPress={() => navigation.navigate("Home")}  // ← Cambiado de goBack()
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
});
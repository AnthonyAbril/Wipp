// prueba1.js
import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  ScrollView 
} from 'react-native';

// Importar el tipo de navegación y las props
import { StackScreenProps } from '@react-navigation/stack';

// En App.tsx y las pantallas
import { RootStackParamList } from '../types/navigation';

// Definir las props del componente
type Props = StackScreenProps<RootStackParamList, 'Prueba1'>;

// Recibimos navigation como prop ≈ ActivatedRoute en Angular
export default function Prueba1({ navigation }:Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla de Detalles</Text>
      <Text style={styles.description}>
        ¡Esta es una nueva página en tu app!
      </Text>

      {/* Ejemplo de información estática */}
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Característica 1</Text>
          <Text>Descripción de la característica...</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Característica 2</Text>
          <Text>Otra descripción interesante...</Text>
        </View>
      </ScrollView>

      {/* Botón para volver ≈ router.navigate en Angular */}
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.goBack()} // Volver atrás
      >
        <Text style={styles.buttonText}>Volver al Inicio</Text>
      </TouchableOpacity>

      {/* Botón para ir a otra página */}
      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation.navigate('PruebaPrincipal')} // Navegar por nombre
      >
        <Text style={styles.buttonText}>Ir al Home por nombre</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  content: {
    flex: 1,
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#007AFF',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
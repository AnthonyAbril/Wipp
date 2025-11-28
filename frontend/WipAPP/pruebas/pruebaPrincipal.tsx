
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert 
} from 'react-native';

import { useState } from 'react'; // Hook para estado (como BehaviorSubject)


// Importar el tipo de navegación y las props
import { StackScreenProps } from '@react-navigation/stack';

// En App.tsx y las pantallas
import { RootStackParamList } from '../types/navigation';

// Definir las props del componente
type Props = StackScreenProps<RootStackParamList, 'PruebaPrincipal'>;


export default function PruebaPrincipal({ navigation }:Props) {
  // Estado ≈ Variables reactivas en Angular
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  const [items, setItems] = useState<string[]>([]);

  // Métodos ≈ Métodos en clase Angular
  const handleIncrement = () => {
    setCount(count + 1);
  };

  const handleAddItem = () => {
    if (name.trim()) {
      setItems([...items, name]);
      setName('');
    } else {
      Alert.alert('Error', 'Por favor ingresa un nombre');
    }
  };

  const handleReset = () => {
    setCount(0);
    setItems([]);
    setName('');
  };

  // JSX ≈ Template de Angular
  return (
    <View style={styles.container}>
      {/* Sección 1: Contador */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}> Ir a Login </Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mi Primera App React Native</Text>
        <Text style={styles.counter}>Contador: {count}</Text>
        
        <TouchableOpacity style={styles.button} onPress={handleIncrement}>
          <Text style={styles.buttonText}>Incrementar +</Text>
        </TouchableOpacity>
      </View>

      {/* Sección 2: Input y Lista */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Agregar Elementos</Text>
        
        {/* TextInput ≈ input en Angular */}
        <TextInput
          style={styles.input}
          placeholder="Escribe algo..."
          value={name}
          onChangeText={setName} // Binding bidireccional automático
        />
        
        <TouchableOpacity style={styles.button} onPress={handleAddItem}>
          <Text style={styles.buttonText}>Agregar a la lista</Text>
        </TouchableOpacity>

        {/* ScrollView ≈ *ngFor con scroll */}
        <ScrollView style={styles.listContainer}>
          {items.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text>{item}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Botón de reset */}
      <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={handleReset}>
        <Text style={styles.buttonText}>Reiniciar Todo</Text>
      </TouchableOpacity>

      <TouchableOpacity
      style={styles.button}
      onPress={() => navigation.navigate('Prueba1')}    // ≈ router.navigate()
      >
        <text style={styles.buttonText}>Ir a las pruebas n1</text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}

// StyleSheet ≈ CSS del componente
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    paddingTop: 60,
  },
  section: {
    marginBottom: 30,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#555',
  },
  counter: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  resetButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    maxHeight: 200,
    marginTop: 10,
  },
  listItem: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
});
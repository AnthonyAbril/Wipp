import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  ScrollView 
} from 'react-native';

// Importar tipos
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

/*
    ESTA ES UNA PLANTILLA PARA CREAR UNA NUEVA PAGINA

    el proceso es simple pero largo

    Sigue siempre estos 4 pasos:

        Agregar ruta en types/navigation.ts

        Crear componente NombrePagina.tsx

        Importar y registrar en App.tsx

        Agregar navegación desde donde quieras acceder


    Para mandar y recibir datos entre pantallas se usa esto:

    // En types/navigation.ts
    export type RootStackParamList = {
    // ...
    Profile: { userId: string; userName: string };
    };

    // Navegar pasando parámetros
    navigation.navigate('Profile', { 
    userId: '123', 
    userName: 'Ana' 
    });

    // Recibir parámetros en Profile.tsx
    type Props = StackScreenProps<RootStackParamList, 'Profile'>;

    export default function Profile({ route, navigation }: Props) {
    const { userId, userName } = route.params;
    
    return (
        <View>
        <Text>Usuario: {userName}</Text>
        <Text>ID: {userId}</Text>
        </View>
    );
    }
*/

// Definir las props
type Props = StackScreenProps<RootStackParamList, 'LinkCar'>;

export default function LinkCarScreen({ navigation }: Props) {
  return (

    //PRUEBAS DE NAVEGACION

    <View style={styles.container}>
      <Text style={styles.title}>¡Nueva Página!</Text>
      <Text style={styles.subtitle}>
        Esta es una página adicional en tu app
      </Text>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información Importante</Text>
          <Text>
            Aquí puedes mostrar contenido adicional, configuraciones, 
            o cualquier información que necesites en tu aplicación.
          </Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Características</Text>
          <Text>• Navegación fluida</Text>
          <Text>• Tipado seguro con TypeScript</Text>
          <Text>• Diseño responsive</Text>
        </View>
      </ScrollView>

      {/* Botones de navegación */}
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Volver Atrás</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation.navigate('pruebaPrincipal')}
      >
        <Text style={styles.buttonText}>Ir al Home</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.tertiaryButton]}
        onPress={() => navigation.navigate('prueba1')}
      >
        <Text style={styles.buttonText}>Volver a Details</Text>
      </TouchableOpacity>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f8',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
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
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#FF6B6B',
  },
  button: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#4ECDC4',
  },
  tertiaryButton: {
    backgroundColor: '#45B7D1',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
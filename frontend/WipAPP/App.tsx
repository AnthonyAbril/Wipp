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

import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';


// Importamos las plantillas
import OnboardingScreen from './onboards';
import PruebaPrincipal from './pruebas/pruebaPrincipal';
import Prueba1 from './pruebas/prueba1'
import PlantillaPruebas from './pruebas/plantillaPruebas'
import login from './auth/login'
import register from './auth/register'
import HomeScreen from './principal/HomeScreen'

const Stack = createStackNavigator<RootStackParamList>();

// En App.tsx y las pantallas
import { RootStackParamList } from './types/navigation';
import LinkCarScreen from './principal/LinkCarScreen';
import CarHomeScreen from './principal/CarHomeScreen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TestScrollScreen from './TestScrollScreen';
import CreateCarScreen from './principal/CreateCarScreen';

// Crear el navigator con el tipo = RouterModule en Angular
//const Stack = createStackNavigator<RootStackParamList>();


// Creamos el navigator = RouterModule en Angular
//const Stack = createStackNavigator();


export default function App() {
  console.log("App loaded");
  
  return(
    
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <NavigationContainer >

          <StatusBar/>
          <Stack.Navigator
            /*
            initialRouteName="Onboarding"  // 👈 Empieza con onboarding
            */

            initialRouteName="Onboarding" //Rutaa inicial
            
            screenOptions={{
              cardStyle: {
                  flex: 1
                },
              headerStyle: {
                backgroundColor: '#CCCCC',
              },
              headerTintColor: 'white',
              headerTitleStyle: {
                fontWeight: 'bold'
              },
              headerShown: false,
              animation: 'reveal_from_bottom',                // 👈 Animación suave
              transitionSpec: {               // 👈 Configuración avanzada de animación
                open: { animation: 'timing', config: { duration: 300 } },
                close: { animation: 'timing', config: { duration: 300 } }
              }
            }}>
            

          {/* Todas estas pantallas heredarán headerShown: false */}

          
          {/* ✅ Asegúrate de que esta línea esté presente */}
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />

          <Stack.Screen
            name="PruebaPrincipal"
            component={PruebaPrincipal}
            options={{ title: 'Inicio' }}
          />

          <Stack.Screen
            name="Prueba1"
            component={Prueba1}
            options={{ title: 'Detalles'}}
          />

          <Stack.Screen
            name="PlantillaPruebas"
            component={PlantillaPruebas}
            options={{ 
              title: 'plantilla de pruebas',
              headerShown: false
            }}
          />

          <Stack.Screen
            name="Login"
            component={login}
            options={{ title: 'login'}}
          />

          <Stack.Screen
            name="Register"
            component={register}
            options={{ title: 'register'}}
          />

          
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ 
              headerShown: false // 👈 Asegúrate que esté en false
            }}
          />

          <Stack.Screen
            name="LinkCar"
            component={LinkCarScreen} // Crear esta pantalla después
            options={{ 
              title: 'Vincular Coche',
              headerShown: false,
              animation: 'slide_from_right'
            }}
          />

          <Stack.Screen
            name='CreateCar'
            component={CreateCarScreen}
            options={
              {animation: 'slide_from_right'}
            }
          />

          <Stack.Screen
            name="CarHome"
            component={CarHomeScreen} // Crear esta pantalla después
            options={{ 
              headerShown: true,
              title: 'Mi Coche'
            }}
          />



          <Stack.Screen
            name="TestScroll"
            component={TestScrollScreen} // Crear esta pantalla después
            options={{ 
              headerShown: false,
              title: 'Mi Coche'
            }}
          />
          </Stack.Navigator>

        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1, // ¡Asegúrate de que el contenedor principal tenga flex: 1!
  },
});
// screens/OnboardingScreen.tsx
import { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    StatusBar,
    Dimensions,
    NativeSyntheticEvent,
    NativeScrollEvent
} from 'react-native';

import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from './types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = StackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: screenWidth } = Dimensions.get('window');

const onboardingSlides = [
  {
    id: '1',
    title: 'Bienvenido',
    description: 'Gestiona tus tareas de forma eficiente y aumenta tu productividad',
    icon: '🎯'
  },
  {
    id: '2', 
    title: 'Organiza',
    description: 'Clasifica y prioriza tus actividades por importancia y fecha',
    icon: '📊'
  },
  {
    id: '3',
    title: 'Logra',
    description: 'Cumple tus objetivos diarios y celebra tus progresos',
    icon: '🚀'
  }
];

export default function OnboardingScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollInProgress = useRef(false);

  const nextSlide = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollInProgress.current = true;
      flatListRef.current?.scrollToIndex({ 
        index: nextIndex, 
        animated: true 
      });
      // Actualizamos el índice después de un pequeño delay para que coincida con la animación
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        scrollInProgress.current = false;
      }, 300);
    } else {
      navigation.navigate('Login');
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      scrollInProgress.current = true;
      flatListRef.current?.scrollToIndex({ 
        index: prevIndex, 
        animated: true 
      });
      setTimeout(() => {
        setCurrentIndex(prevIndex);
        scrollInProgress.current = false;
      }, 300);
    }
  };

  const skipOnboarding = () => {
    navigation.navigate('Login');
  };

  // Detectar cuando el usuario desliza manualmente
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Solo actualizar si no hay un scroll programático en progreso
    if (scrollInProgress.current) return;
    
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    
    // Solo actualizar si el índice realmente cambió
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  // Manejar el fin del scroll momentum (cuando la animación termina)
  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollInProgress.current = false;
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    setCurrentIndex(index);
  };

  const isLastSlide = currentIndex === onboardingSlides.length - 1;
  const isFirstSlide = currentIndex === 0;

  // Renderizar cada item del FlatList
  const renderItem = ({ item }: { item: typeof onboardingSlides[0] }) => (
    <View style={styles.slide}>
      <Text style={styles.icon}>{item.icon}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header con botón de saltar (excepto en la última slide) */}
      {!isLastSlide && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.skipButton} onPress={skipOnboarding}>
            <Text style={styles.skipText}>Saltar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FlatList para el deslizamiento */}
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        // Prevenir scroll durante animaciones programáticas
        scrollEnabled={!scrollInProgress.current}
      />

      {/* Indicadores - Versión mejorada */}
      <View style={styles.dots}>
        {onboardingSlides.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              if (index !== currentIndex && !scrollInProgress.current) {
                scrollInProgress.current = true;
                flatListRef.current?.scrollToIndex({ 
                  index, 
                  animated: true 
                });
                setTimeout(() => {
                  setCurrentIndex(index);
                  scrollInProgress.current = false;
                }, 300);
              }
            }}
          >
            <View 
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Botones de navegación */}
      <View style={styles.buttonsContainer}>
        {!isFirstSlide && (
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={prevSlide}
            disabled={scrollInProgress.current}
          >
            <Text style={[
              styles.secondaryButtonText,
              scrollInProgress.current && styles.disabledText
            ]}>
              Anterior
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[
            styles.button,
            scrollInProgress.current && styles.buttonDisabled
          ]} 
          onPress={nextSlide}
          disabled={scrollInProgress.current}
        >
          <Text style={styles.buttonText}>
            {isLastSlide ? 'Comenzar' : 'Siguiente'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'flex-end',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  slide: {
    width: screenWidth,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 120,
    marginBottom: 40,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  description: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginHorizontal: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  secondaryButton: {
    flex: 0.5,
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledText: {
    color: '#ccc',
  },
});
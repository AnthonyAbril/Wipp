// types/navigation.ts
export type RootStackParamList = {
  PruebaPrincipal: undefined;
  Prueba1: undefined;

  Onboarding: undefined;

  Home: { refresh?: boolean } | undefined;  // ← AGREGAR ESTO

  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;

  TestScroll: undefined;

  PlantillaPruebas: undefined;
  // Puedes agregar más pantallas aquí

  
  UserProfile: undefined;
  CarHome: { 
    car: any; 
    refresh?: boolean;  // ← AGREGAR ESTO
  } | undefined;
  LinkCar: undefined;
  CreateCar: undefined;
  EditProfile: { currentImage?: string };
  EditCarImage: { car: any };
};

// Extender los tipos globales de React Navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
// types/navigation.ts
export type RootStackParamList = {
  PruebaPrincipal: undefined;
  Prueba1: undefined;

  Onboarding: undefined;

  Home: undefined;

  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;

  TestScroll: undefined;

  PlantillaPruebas: undefined;
  // Puedes agregar más pantallas aquí

  
  UserProfile: undefined;
  CarHome: { car: any };
  LinkCar: undefined;
  CreateCar: undefined;
};

// Extender los tipos globales de React Navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
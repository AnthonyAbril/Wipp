// screens/Register.tsx
import { useState, useRef } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Keyboard
} from 'react-native';

// Importar tipos
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { authAPI } from '../services/authAPI';

type Props = StackScreenProps<RootStackParamList, 'Register'>;

export default function Register({ navigation }: Props) {
    
    // Estados - Agregamos nombre y confirmar contraseña
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [errors, setErrors] = useState({ 
        name: '', 
        email: '', 
        password: '',
        confirmPassword: '',
        general: ''  // Nuevo estado para errores generales
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    // Refs para navegación entre campos
    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const confirmPasswordRef = useRef<TextInput>(null);
    
    // Validación mejorada
    const validateForm = (): boolean => {
        const newErrors = { 
            name: '', 
            email: '', 
            password: '',
            confirmPassword: '',
            general: ''
        };
        
        // Validar nombre
        if (!name.trim()) {
            newErrors.name = 'El nombre es requerido';
        } else if (name.trim().length < 2) {
            newErrors.name = 'El nombre debe tener al menos 2 caracteres';
        }

        // Validar email
        if (!email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email no válido';
        }

        // Validar contraseña
        if (!password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (password.length < 6) {
            newErrors.password = 'Mínimo 6 caracteres';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            newErrors.password = 'Debe contener mayúsculas, minúsculas y números';
        }

        // Validar confirmación de contraseña
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Confirma tu contraseña';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        // Se guardan los errores recopilados
        setErrors(newErrors);
        return !newErrors.name && !newErrors.email && !newErrors.password && !newErrors.confirmPassword;
    };

    // Manejo del registro mejorado
    const handleRegister = async (): Promise<void> => {
        Keyboard.dismiss();
        
        // Limpiar errores anteriores
        setErrors({ 
            name: '', 
            email: '', 
            password: '', 
            confirmPassword: '',
            general: ''
        });
        
        if (!validateForm()) return;
        
        setIsLoading(true);
        
        try {
            console.log('🔄 Iniciando registro...');
            const response = await authAPI.register(name, email, password, confirmPassword);
            
            // ✅ Registro exitoso
            console.log('✅ Register response:', response);

            if (response.data?.access_token) {
                console.log("entrando en su cuenta");
            // Navegar al Home con parámetros de actualización
            navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
            });
            } else {
            // Si no hay token, ir al login
                console.log("saliendo a login");
                navigation.navigate('Login');
            }
            
        } catch (error: any) {
            console.error('❌ Register error:', error);
            
            // Mostrar error específico
            let errorMessage = error.message || 'Ha ocurrido un error al crear tu cuenta.';
            
            // Si es error de email duplicado, limpiar campo email
            if (error.message.toLowerCase().includes('email') || error.message.toLowerCase().includes('correo')) {
                setEmail('');
            }
            
            setErrors(prev => ({ ...prev, general: errorMessage }));
            
        } finally {
            setIsLoading(false);
        }
    };

    // Limpiar errores cuando el usuario escribe
    const handleNameChange = (text: string): void => {
        setName(text);
        if (errors.name || errors.general) {
            setErrors(prev => ({ ...prev, name: '', general: '' }));
        }
    };

    const handleEmailChange = (text: string): void => {
        setEmail(text);
        if (errors.email || errors.general) {
            setErrors(prev => ({ ...prev, email: '', general: '' }));
        }
    };

    const handlePasswordChange = (text: string): void => {
        setPassword(text);
        if (errors.password || errors.general) {
            setErrors(prev => ({ ...prev, password: '', general: '' }));
        }
        // También limpiar error de confirmación si existe
        if (errors.confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: '' }));
        }
    };

    const handleConfirmPasswordChange = (text: string): void => {
        setConfirmPassword(text);
        if (errors.confirmPassword || errors.general) {
            setErrors(prev => ({ ...prev, confirmPassword: '', general: '' }));
        }
    };

    // Manejo de navegación entre campos
    const handleNameSubmit = (): void => {
        emailRef.current?.focus();
    };

    const handleEmailSubmit = (): void => {
        passwordRef.current?.focus();
    };

    const handlePasswordSubmit = (): void => {
        confirmPasswordRef.current?.focus();
    };

    const handleConfirmPasswordSubmit = (): void => {
        handleRegister();
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Regístrate</Text>
                    <Text style={styles.subtitle}>
                        Crea una cuenta
                    </Text>
                </View>

                <View style={styles.form}>
                    {/* Mostrar error general */}
                    {errors.general ? (
                        <View style={styles.generalErrorContainer}>
                            <Text style={styles.generalErrorText}>{errors.general}</Text>
                        </View>
                    ) : null}

                    {/* Campo Nombre */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Nombre completo</Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.name && styles.inputError
                            ]}
                            placeholder="Tu nombre completo"
                            placeholderTextColor="#999"
                            value={name}
                            onChangeText={handleNameChange}
                            autoCapitalize="words"
                            autoComplete="name"
                            returnKeyType="next"
                            onSubmitEditing={handleNameSubmit}
                            editable={!isLoading}
                        />
                        {errors.name ? (
                            <Text style={styles.errorText}>{errors.name}</Text>
                        ) : null}
                    </View>

                    {/* Campo Email */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            ref={emailRef}
                            style={[
                                styles.input,
                                errors.email && styles.inputError
                            ]}
                            placeholder="tu@email.com"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={handleEmailChange}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            returnKeyType="next"
                            onSubmitEditing={handleEmailSubmit}
                            editable={!isLoading}
                        />
                        {errors.email ? (
                            <Text style={styles.errorText}>{errors.email}</Text>
                        ) : null}
                    </View>

                    {/* Campo Contraseña */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Contraseña</Text>
                        <TextInput
                            ref={passwordRef}
                            style={[
                                styles.input,
                                errors.password && styles.inputError
                            ]}
                            placeholder="••••••••"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={handlePasswordChange}
                            secureTextEntry={!isPasswordVisible}
                            autoCapitalize="none"
                            returnKeyType="next"
                            onSubmitEditing={handlePasswordSubmit}
                            editable={!isLoading}
                        />
                        {/* Boton de visibilidad de contraseña */}
                        <TouchableOpacity
                            style={styles.visibilityToggle}
                            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                            disabled={isLoading}
                        >
                            <Text style={styles.visibilityText}>
                                {isPasswordVisible ? 'Ocultar' : 'Mostrar'}
                            </Text>
                        </TouchableOpacity>
                        {errors.password ? (
                            <Text style={styles.errorText}>{errors.password}</Text>
                        ) : null}
                    </View>

                    {/* Campo Confirmar Contraseña */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Confirmar Contraseña</Text>
                        <TextInput
                            ref={confirmPasswordRef}
                            style={[
                                styles.input,
                                errors.confirmPassword && styles.inputError
                            ]}
                            placeholder="••••••••"
                            placeholderTextColor="#999"
                            value={confirmPassword}
                            onChangeText={handleConfirmPasswordChange}
                            secureTextEntry={!isConfirmPasswordVisible}
                            autoCapitalize="none"
                            returnKeyType="done"
                            onSubmitEditing={handleConfirmPasswordSubmit}
                            editable={!isLoading}
                        />
                        {/* Boton de visibilidad de confirmar contraseña */}
                        <TouchableOpacity
                            style={styles.visibilityToggle}
                            onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                            disabled={isLoading}
                        >
                            <Text style={styles.visibilityText}>
                                {isConfirmPasswordVisible ? 'Ocultar' : 'Mostrar'}
                            </Text>
                        </TouchableOpacity>
                        {errors.confirmPassword ? (
                            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                        ) : null}
                    </View>

                    {/* Boton de Register */}
                    <TouchableOpacity
                        style={[
                            styles.button,
                            isLoading && styles.buttonDisabled
                        ]}
                        onPress={handleRegister}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text style={styles.buttonText}>Crear Cuenta</Text>
                        )}
                    </TouchableOpacity>

                    {/* Enlaces adicionales */}
                    <View style={styles.linksContainer}>
                        <View style={styles.loginRedirect}>
                            <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
                            <TouchableOpacity 
                                onPress={() => navigation.navigate('Login')}
                                disabled={isLoading}
                            >
                                <Text style={styles.loginLink}>Iniciar sesión</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
        position: 'relative',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        color: '#333',
    },
    inputError: {
        borderColor: '#dc3545',
        backgroundColor: '#fff5f5',
    },
    errorText: {
        color: '#dc3545',
        fontSize: 14,
        marginTop: 4,
    },
    visibilityToggle: {
        position: 'absolute',
        right: 16,
        top: 42,
    },
    visibilityText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#34C759',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
        shadowColor: '#34C759',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    linksContainer: {
        alignItems: 'center',
    },
    loginRedirect: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loginText: {
        color: '#666',
        fontSize: 14,
    },
    loginLink: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
    // Nuevos estilos para errores generales
    generalErrorContainer: {
        backgroundColor: '#ffeaea',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#dc3545',
        marginBottom: 20,
    },
    generalErrorText: {
        color: '#dc3545',
        fontSize: 14,
        fontWeight: '500',
    },
});
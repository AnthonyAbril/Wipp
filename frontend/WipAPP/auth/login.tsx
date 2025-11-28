// screens/Login.tsx
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
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { authAPI } from '../services/authAPI';

type Props = StackScreenProps<RootStackParamList, 'Login'>;

export default function Login({ navigation }: Props) {
    // Estados
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({ 
        email: '', 
        password: '',
        general: ''  // Nuevo estado para errores generales
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const passwordRef = useRef<TextInput>(null);

    // Validación mejorada
    const validateForm = (): boolean => {
        const newErrors = { email: '', password: '', general: '' };
        
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
        }
        
        setErrors(newErrors);
        return !newErrors.email && !newErrors.password;
    };

    // Manejo de login mejorado
    const handleLogin = async (): Promise<void> => {
        Keyboard.dismiss();
        
        // Limpiar errores anteriores
        setErrors({ email: '', password: '', general: '' });
        
        if (!validateForm()) return;
        
        setIsLoading(true);
        
        try {
            console.log('🔄 Iniciando login...');
            const response = await authAPI.login(email, password);
            
            // ✅ Login exitoso
            console.log('✅ Login response:', response);
            
            // Navegar al home
            navigation.navigate('Home');
            
        } catch (error: any) {
            console.error('❌ Login error:', error);
            
            // Mostrar error específico
            let errorMessage = error.message || 'Las credenciales ingresadas son incorrectas.';
            
            // Si es error de credenciales, limpiar campo de contraseña
            if (error.message.includes('credenciales')) {
                setPassword('');
            }
            
            setErrors(prev => ({ ...prev, general: errorMessage }));
            
        } finally {
            setIsLoading(false);
        }
    };

    // Limpiar errores al escribir
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
    };

    // Manejo de teclado
    const handleEmailSubmit = (): void => {
        passwordRef.current?.focus();
    };

    const handlePasswordSubmit = (): void => {
        handleLogin();
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
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Bienvenido</Text>
                    <Text style={styles.subtitle}>
                        Inicia sesión en tu cuenta
                    </Text>
                </View>

                {/* Formulario */}
                <View style={styles.form}>
                    {/* Mostrar error general */}
                    {errors.general ? (
                        <View style={styles.generalErrorContainer}>
                            <Text style={styles.generalErrorText}>{errors.general}</Text>
                        </View>
                    ) : null}

                    {/* Campo Email */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
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
                            returnKeyType="done"
                            onSubmitEditing={handlePasswordSubmit}
                            editable={!isLoading}
                        />
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

                    {/* Botón de Login */}
                    <TouchableOpacity 
                        style={[
                            styles.button, 
                            isLoading && styles.buttonDisabled
                        ]} 
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text style={styles.buttonText}>Iniciar Sesión</Text>
                        )}
                    </TouchableOpacity>

                    {/* Enlaces adicionales */}
                    <View style={styles.linksContainer}>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('ForgotPassword')}
                            disabled={isLoading}
                        >
                            <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
                        </TouchableOpacity>
                        
                        <View style={styles.registerContainer}>
                            <Text style={styles.registerText}>¿No tienes cuenta? </Text>
                            <TouchableOpacity 
                                onPress={() => navigation.navigate('Register')}
                                disabled={isLoading}
                            >
                                <Text style={styles.registerLink}>Regístrate</Text>
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
        paddingTop: 80,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
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
        color: '#8F67AA',
        fontSize: 14,
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#8F67AA',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
        shadowColor: '#8F67AA',
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
        gap: 16,
    },
    linkText: {
        color: '#8F67AA',
        fontSize: 14,
        fontWeight: '500',
    },
    registerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    registerText: {
        color: '#666',
        fontSize: 14,
    },
    registerLink: {
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
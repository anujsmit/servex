import { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    Alert,
    TouchableOpacity,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import * as Haptics from 'expo-haptics';

interface Errors {
    phone?: string | null;
}

type RoleParam = 'user' | 'mistri';

const ROLE_CONFIG: Record<RoleParam, { accent: string; title: string; subtitle: string; buttonLabel: string }> = {
    user: {
        accent: '#0177b8',
        title: 'Find a Service',
        subtitle: 'Enter your phone to book trusted professionals',
        buttonLabel: 'Continue',
    },
    mistri: {
        accent: '#179d2e',
        title: "I'm a Mistri",
        subtitle: 'Enter your phone to offer your skills and start earning',
        buttonLabel: 'Continue',
    },
};

export default function LoginScreen() {
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Errors>({});
    const router = useRouter();
    const { sendOtp } = useAuth();
    const params = useLocalSearchParams<{ role?: string }>();

    const role: RoleParam = params.role === 'mistri' ? 'mistri' : 'user';
    const config = ROLE_CONFIG[role];

    const validatePhone = (phoneNumber: string): boolean => {
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(phoneNumber);
    };

    const handlePhoneChange = (text: string): void => {
        const cleanedText = text.replace(/\D/g, '');
        if (cleanedText.length <= 10) {
            setPhone(cleanedText);
            if (errors.phone) {
                setErrors({ ...errors, phone: null });
            }
        }
    };

    const handleSendOtp = async () => {
        setErrors({});

        if (!phone) {
            setErrors({ phone: 'Phone number is required' });
            return;
        }

        if (!validatePhone(phone)) {
            setErrors({ phone: 'Please enter a valid 10-digit phone number' });
            return;
        }

        setIsLoading(true);

        try {
            await sendOtp(phone);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push({ pathname: '/verify-otp', params: { phone, role } });
        } catch (error) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Back button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
                    >
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.headerSection}>
                        <Image
                            source={require('../../assets/images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.brandName}>ServeX</Text>
                        <View style={[styles.roleBadge, { backgroundColor: `${config.accent}18`, borderColor: `${config.accent}40` }]}>
                            <Text style={[styles.roleBadgeText, { color: config.accent }]}>{config.title}</Text>
                        </View>
                        <Text style={styles.headerSubtitle}>{config.subtitle}</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formSection}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <View style={[
                                styles.phoneInputWrapper,
                                errors.phone && styles.inputError,
                                phone.length === 10 && !errors.phone && { borderColor: config.accent },
                            ]}>
                                <View style={styles.countryCode}>
                                    <Text style={styles.countryCodeText}>+977</Text>
                                </View>
                                <TextInput
                                    placeholder="Enter your phone number"
                                    value={phone}
                                    onChangeText={handlePhoneChange}
                                    keyboardType="phone-pad"
                                    style={styles.phoneInput}
                                    maxLength={10}
                                    autoFocus={false}
                                    returnKeyType="done"
                                    onSubmitEditing={handleSendOtp}
                                />
                            </View>
                            {errors.phone && (
                                <Text style={styles.errorText}>{errors.phone}</Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.sendOtpButton,
                                { backgroundColor: config.accent },
                                (!phone || phone.length !== 10 || isLoading) && styles.buttonDisabled,
                            ]}
                            onPress={handleSendOtp}
                            disabled={!phone || phone.length !== 10 || isLoading}
                            activeOpacity={0.8}
                        >
                            <Text style={[
                                styles.sendOtpButtonText,
                                (!phone || phone.length !== 10 || isLoading) && styles.buttonTextDisabled,
                            ]}>
                                {isLoading ? 'Sending OTP...' : config.buttonLabel}
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.infoText}>
                            We'll send a verification code to this number
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 30,
        paddingTop: 20,
        paddingBottom: 40,
    },
    backButton: {
        paddingVertical: 8,
        marginBottom: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#666666',
        fontWeight: '500',
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 16,
    },
    logo: {
        width: 70,
        height: 70,
        marginBottom: 12,
    },
    brandName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    roleBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 12,
    },
    roleBadgeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    headerSubtitle: {
        fontSize: 15,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '400',
        paddingHorizontal: 10,
    },
    formSection: {
        flex: 1,
        justifyContent: 'center',
    },
    inputContainer: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    phoneInputWrapper: {
        flexDirection: 'row',
        borderWidth: 2,
        borderColor: '#e5e5e5',
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
        overflow: 'hidden',
    },
    inputError: {
        borderColor: '#ff4757',
    },
    countryCode: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#f1f2f6',
        borderRightWidth: 1,
        borderRightColor: '#e5e5e5',
        justifyContent: 'center',
    },
    countryCodeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1a1a1a',
        backgroundColor: 'transparent',
    },
    errorText: {
        color: '#ff4757',
        fontSize: 14,
        marginTop: 6,
        fontWeight: '500',
    },
    sendOtpButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonDisabled: {
        backgroundColor: '#e5e5e5',
    },
    sendOtpButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    buttonTextDisabled: {
        color: '#999999',
    },
    infoText: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
});

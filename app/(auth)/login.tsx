import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    Image,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import NepaliDate from 'nepali-date-converter';
import { useAuth } from '../../context/AuthContext';

interface Errors {
    name?: string;
    phone?: string;
    password?: string;
    dob?: string;
}

interface FormData {
    name: string;
    phone: string;
    password: string;
    dob: string;
}

type RoleParam = 'user' | 'mistri';

const ROLE_CONFIG = {
    user: {
        accent: '#0177b8',
        title: 'Find a Service',
        subtitle: 'Login or create account',
        placeholder: 'e.g., John Doe',
    },
    mistri: {
        accent: '#179d2e',
        title: "I'm a Mistri",
        subtitle: 'Login or start earning',
        placeholder: 'e.g., Ram Bahadur',
    },
};

// Month names in Nepali calendar
const MONTH_NAMES = [
    'Baisakh', 'Jestha', 'Ashad', 'Shrawan', 'Bhadra', 'Ashwin',
    'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

// Get current Nepali date in YYYY-MM-DD format
const getCurrentNepaliDate = (): string => {
    const nepaliDate = new NepaliDate(new Date());
    const year = nepaliDate.getYear();
    const month = String(nepaliDate.getMonth() + 1).padStart(2, '0');
    const day = String(nepaliDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Format Nepali date for display (e.g., "2060-04-28" -> "Baisakh 28, 2060")
const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
        const [year, month, day] = dateStr.split('-').map(Number);
        return `${MONTH_NAMES[month - 1]} ${day}, ${year} BS`;
    } catch {
        return dateStr;
    }
};

// Calculate age from Nepali date
const calculateAgeFromNepaliDate = (nepaliDateStr: string): number | null => {
    if (!nepaliDateStr) return null;
    try {
        const currentNepali = new NepaliDate(new Date());
        const [year, month, day] = nepaliDateStr.split('-').map(Number);
        
        let age = currentNepali.getYear() - year;
        const currentMonth = currentNepali.getMonth() + 1;
        const currentDay = currentNepali.getDate();
        
        if (currentMonth < month || (currentMonth === month && currentDay < day)) {
            age--;
        }
        return age;
    } catch {
        return null;
    }
};

export default function LoginScreen() {
    const router = useRouter();
    const { loginWithPassword, register, isLoading: authLoading } = useAuth();
    const params = useLocalSearchParams<{ role?: string }>();

    const role: RoleParam = params.role === 'mistri' ? 'mistri' : 'user';
    const config = ROLE_CONFIG[role];

    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [formData, setFormData] = useState<FormData>({
        name: '',
        phone: '',
        password: '',
        dob: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Errors>({});

    // Nepali date picker states
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedDay, setSelectedDay] = useState('');

    // Generate data for pickers
    const currentYear = new NepaliDate(new Date()).getYear();
    const years = Array.from({ length: 121 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 32 }, (_, i) => i + 1);

    const showToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
        Toast.show({
            type: type,
            text1: title,
            text2: message,
            position: 'top',
            visibilityTime: 3000,
            autoHide: true,
            topOffset: 50,
        });
    };

    const validatePhone = (phoneNumber: string): boolean => {
        return /^[6-9]\d{9}$/.test(phoneNumber);
    };

    const validateForm = (): boolean => {
        const newErrors: Errors = {};

        if (mode === 'signup') {
            if (!formData.name.trim()) {
                newErrors.name = 'Full name is required';
                showToast('error', 'Validation Error', 'Full name is required');
            } else if (formData.name.trim().length < 2) {
                newErrors.name = 'Name must be at least 2 characters';
                showToast('error', 'Validation Error', 'Name must be at least 2 characters');
            }

            if (!formData.dob) {
                newErrors.dob = 'Date of birth is required';
                showToast('error', 'Validation Error', 'Date of birth is required');
            } else {
                const age = calculateAgeFromNepaliDate(formData.dob);
                if (age !== null && age < 18) {
                    newErrors.dob = 'You must be at least 18 years old';
                    showToast('error', 'Age Restriction', `You are ${age} years old. Minimum age is 18.`);
                }
            }
        }

        if (!formData.phone) {
            newErrors.phone = 'Phone number is required';
            showToast('error', 'Validation Error', 'Phone number is required');
        } else if (!validatePhone(formData.phone)) {
            newErrors.phone = 'Enter a valid 10-digit number';
            showToast('error', 'Validation Error', 'Enter a valid 10-digit phone number');
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
            showToast('error', 'Validation Error', 'Password is required');
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
            showToast('error', 'Validation Error', 'Password must be at least 6 characters');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handlePhoneChange = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 10) {
            handleInputChange('phone', cleaned);
        }
    };

    const openDatePicker = () => {
        if (formData.dob) {
            const [year, month, day] = formData.dob.split('-');
            setSelectedYear(year);
            setSelectedMonth(month);
            setSelectedDay(day);
        } else {
            const currentDate = getCurrentNepaliDate();
            const [year, month, day] = currentDate.split('-');
            setSelectedYear(year);
            setSelectedMonth(month);
            setSelectedDay(day);
        }
        setShowDatePicker(true);
    };

    const handleDateConfirm = () => {
        if (!selectedYear || !selectedMonth || !selectedDay) {
            showToast('error', 'Error', 'Please select complete date');
            return;
        }

        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonth);
        const day = parseInt(selectedDay);

        if (year < 1970 || year > 2090) {
            showToast('error', 'Error', 'Year must be between 1970 and 2090 BS');
            return;
        }

        if (month < 1 || month > 12) {
            showToast('error', 'Error', 'Please select a valid month');
            return;
        }

        // Max days validation for Nepali months
        let maxDays = 32;
        if (month === 2) maxDays = 31; // Jestha
        if (month === 8) maxDays = 30; // Bhadra
        
        if (day < 1 || day > maxDays) {
            showToast('error', 'Error', `Please select a valid day for ${MONTH_NAMES[month - 1]}`);
            return;
        }

        // Format as YYYY-MM-DD (e.g., "2060-04-28")
        const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        handleInputChange('dob', formattedDate);
        setShowDatePicker(false);
        
        const age = calculateAgeFromNepaliDate(formattedDate);
        if (age !== null) {
            if (age < 18) {
                showToast('info', 'Age Notice', `You are ${age} years old. Some services may have age restrictions.`);
            } else {
                showToast('success', 'Date Selected', `${formatDisplayDate(formattedDate)} (Age: ${age})`);
            }
        }
    };

    const handleContinue = async () => {
        if (!validateForm()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        setIsSubmitting(true);
        
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            if (mode === 'signup') {
                // Send Nepali date as is (YYYY-MM-DD)
                await register({
                    phone: formData.phone,
                    fullName: formData.name.trim(),
                    password: formData.password,
                    dob: formData.dob, // Send as "2060-04-28"
                    role,
                });

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showToast('success', 'Registration Successful', 'Please verify your phone number with OTP');
                
                router.push({
                    pathname: '/verify-otp',
                    params: { 
                        phone: formData.phone, 
                        role, 
                        mode: 'signup',
                        name: formData.name.trim()
                    },
                });
            } else {
                const response = await loginWithPassword(formData.phone, formData.password);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                if (response.isVerified === false || response.user?.isVerified === false) {
                    showToast('info', 'Verification Required', 'Please verify your phone number first');
                    router.push({
                        pathname: '/verify-otp',
                        params: { 
                            phone: formData.phone, 
                            role, 
                            mode: 'login' 
                        },
                    });
                    return;
                }

                if (response.user) {
                    showToast('success', 'Welcome Back!', `Hello ${response.user.fullName}`);
                    
                    const userRole = response.user.role;
                    const isOnboarded = response.user.isOnboarded || response.user.is_onboarded;
                    const approvalStatus = response.user.approvalStatus || response.user.approval_status;

                    if (userRole === 'mistri') {
                        if (!isOnboarded) {
                            router.replace('/onboarding/mistri');
                        } else if (approvalStatus !== 'approved') {
                            router.replace('/pending-approval');
                        } else {
                            router.replace('/(mistri)');
                        }
                    } else if (userRole === 'user') {
                        if (!isOnboarded) {
                            router.replace('/onboarding/customer');
                        } else {
                            router.replace('/(customer)');
                        }
                    } else {
                        router.replace('/');
                    }
                }
            }
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showToast('error', 'Authentication Failed', error.message || 'Please try again');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = isSubmitting || authLoading;

    return (
        <>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Text style={styles.backText}>← Back</Text>
                        </TouchableOpacity>

                        <View style={styles.header}>
                            <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
                            <Text style={styles.brand}>ServeX</Text>
                            <Text style={[styles.title, { color: config.accent }]}>{config.title}</Text>
                            <Text style={styles.subtitle}>{config.subtitle}</Text>
                        </View>

                        <View style={styles.switchContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.switchButton, 
                                    mode === 'login' && { backgroundColor: config.accent }
                                ]}
                                onPress={() => {
                                    setMode('login');
                                    setErrors({});
                                }}
                            >
                                <Text style={[
                                    styles.switchText, 
                                    mode === 'login' && { color: '#fff' }
                                ]}>Login</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.switchButton, 
                                    mode === 'signup' && { backgroundColor: config.accent }
                                ]}
                                onPress={() => {
                                    setMode('signup');
                                    setErrors({});
                                }}
                            >
                                <Text style={[
                                    styles.switchText, 
                                    mode === 'signup' && { color: '#fff' }
                                ]}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>

                        {mode === 'signup' && (
                            <>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Full Name</Text>
                                    <TextInput
                                        placeholder={config.placeholder}
                                        placeholderTextColor="#999"
                                        value={formData.name}
                                        onChangeText={(text) => handleInputChange('name', text)}
                                        style={[styles.input, errors.name && styles.inputError]}
                                    />
                                    {errors.name && <Text style={styles.error}>{errors.name}</Text>}
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Date of Birth (BS)</Text>
                                    <TouchableOpacity 
                                        onPress={openDatePicker} 
                                        activeOpacity={0.7}
                                        style={[styles.dateInput, errors.dob && styles.inputError]}
                                    >
                                        <Text style={formData.dob ? styles.dateText : styles.placeholderText}>
                                            {formData.dob ? formatDisplayDate(formData.dob) : 'YYYY-MM-DD (e.g., 2060-04-28)'}
                                        </Text>
                                        <Text style={styles.calendarIcon}>📅</Text>
                                    </TouchableOpacity>
                                    {errors.dob && <Text style={styles.error}>{errors.dob}</Text>}
                                </View>
                            </>
                        )}

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <View style={[styles.phoneWrapper, errors.phone && styles.inputError]}>
                                <View style={styles.countryCode}>
                                    <Text style={styles.countryText}>+977</Text>
                                </View>
                                <TextInput
                                    placeholder="98XXXXXXXX"
                                    placeholderTextColor="#999"
                                    value={formData.phone}
                                    onChangeText={handlePhoneChange}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    style={styles.phoneInput}
                                />
                            </View>
                            {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <TextInput
                                placeholder="••••••••"
                                placeholderTextColor="#999"
                                value={formData.password}
                                onChangeText={(text) => handleInputChange('password', text)}
                                secureTextEntry
                                style={[styles.input, errors.password && styles.inputError]}
                            />
                            {errors.password && <Text style={styles.error}>{errors.password}</Text>}
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: config.accent }]}
                            onPress={handleContinue}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {mode === 'login' ? 'Login' : 'Create Account'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {mode === 'login' && (
                            <TouchableOpacity 
                                style={styles.forgotPassword}
                                onPress={() => router.push('/forgot-password')}
                            >
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Nepali Date Picker Modal */}
                <Modal
                    visible={showDatePicker}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowDatePicker(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Nepali Date (BS)</Text>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Text style={styles.modalClose}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.datePickerContainer}>
                                {/* Year Picker */}
                                <View style={styles.pickerColumn}>
                                    <Text style={styles.pickerLabel}>Year</Text>
                                    <ScrollView 
                                        style={styles.pickerScroll}
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {years.map(year => (
                                            <TouchableOpacity
                                                key={year}
                                                style={[
                                                    styles.pickerItem,
                                                    selectedYear === year.toString() && styles.pickerItemSelected
                                                ]}
                                                onPress={() => setSelectedYear(year.toString())}
                                            >
                                                <Text style={[
                                                    styles.pickerItemText,
                                                    selectedYear === year.toString() && styles.pickerItemTextSelected
                                                ]}>
                                                    {year}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* Month Picker */}
                                <View style={styles.pickerColumn}>
                                    <Text style={styles.pickerLabel}>Month</Text>
                                    <ScrollView 
                                        style={styles.pickerScroll}
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {months.map(month => (
                                            <TouchableOpacity
                                                key={month}
                                                style={[
                                                    styles.pickerItem,
                                                    selectedMonth === month.toString() && styles.pickerItemSelected
                                                ]}
                                                onPress={() => setSelectedMonth(month.toString())}
                                            >
                                                <Text style={[
                                                    styles.pickerItemText,
                                                    selectedMonth === month.toString() && styles.pickerItemTextSelected
                                                ]}>
                                                    {MONTH_NAMES[month - 1]}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* Day Picker */}
                                <View style={styles.pickerColumn}>
                                    <Text style={styles.pickerLabel}>Day</Text>
                                    <ScrollView 
                                        style={styles.pickerScroll}
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {days.map(day => (
                                            <TouchableOpacity
                                                key={day}
                                                style={[
                                                    styles.pickerItem,
                                                    selectedDay === day.toString() && styles.pickerItemSelected
                                                ]}
                                                onPress={() => setSelectedDay(day.toString())}
                                            >
                                                <Text style={[
                                                    styles.pickerItemText,
                                                    selectedDay === day.toString() && styles.pickerItemTextSelected
                                                ]}>
                                                    {day}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.modalButtonCancel]}
                                    onPress={() => setShowDatePicker(false)}
                                >
                                    <Text style={styles.modalButtonCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.modalButtonConfirm, { backgroundColor: config.accent }]}
                                    onPress={handleDateConfirm}
                                >
                                    <Text style={styles.modalButtonConfirmText}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
            <Toast />
        </>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        flexGrow: 1,
    },
    backButton: {
        marginBottom: 20,
    },
    backText: {
        fontSize: 16,
        color: '#666',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        width: 70,
        height: 70,
        marginBottom: 12,
    },
    brand: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginTop: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 6,
    },
    switchContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f2f6',
        borderRadius: 14,
        padding: 4,
        marginBottom: 28,
    },
    switchButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
    },
    switchText: {
        fontWeight: '700',
        color: '#666',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#e5e5e5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fafafa',
        fontSize: 16,
    },
    inputError: {
        borderColor: '#ff3b30',
    },
    phoneWrapper: {
        flexDirection: 'row',
        borderWidth: 1.5,
        borderColor: '#e5e5e5',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#fafafa',
    },
    countryCode: {
        paddingHorizontal: 16,
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
    },
    countryText: {
        fontWeight: '700',
        color: '#333',
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
    },
    error: {
        color: '#ff3b30',
        marginTop: 6,
        fontSize: 12,
    },
    button: {
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 17,
    },
    dateInput: {
        borderWidth: 1.5,
        borderColor: '#e5e5e5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fafafa',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 16,
        color: '#000',
    },
    placeholderText: {
        fontSize: 14,
        color: '#999',
    },
    calendarIcon: {
        fontSize: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxWidth: 500,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalClose: {
        fontSize: 24,
        color: '#666',
    },
    datePickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 250,
    },
    pickerColumn: {
        flex: 1,
        alignItems: 'center',
    },
    pickerLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 10,
    },
    pickerScroll: {
        width: '100%',
        maxHeight: 200,
    },
    pickerItem: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderRadius: 8,
        marginVertical: 2,
    },
    pickerItemSelected: {
        backgroundColor: '#0177b820',
    },
    pickerItemText: {
        fontSize: 14,
        color: '#333',
    },
    pickerItemTextSelected: {
        color: '#0177b8',
        fontWeight: '700',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    modalButtonCancel: {
        backgroundColor: '#f0f0f0',
    },
    modalButtonCancelText: {
        color: '#666',
        fontWeight: '600',
    },
    modalButtonConfirm: {
        backgroundColor: '#0177b8',
    },
    modalButtonConfirmText: {
        color: '#fff',
        fontWeight: '600',
    },
    forgotPassword: {
        alignItems: 'center',
        marginTop: 20,
    },
    forgotPasswordText: {
        color: '#666',
        fontSize: 14,
    },
});
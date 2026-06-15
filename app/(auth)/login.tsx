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
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import NepaliDate from 'nepali-date-converter';
import { useAuth } from '../../context/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

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
        accentLight: '#0177b820',
        title: 'Find a Service',
        subtitle: 'Login or create account',
        placeholder: 'John Doe',
        gradient: ['#0177b8', '#005a8f'] as const,
    },
    mistri: {
        accent: '#179d2e',
        accentLight: '#179d2e20',
        title: "I'm a Mistri",
        subtitle: 'Login or start earning',
        placeholder: 'Ram Bahadur',
        gradient: ['#179d2e', '#0e6b20'] as const,
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

// Date Picker Modal Component
const DatePickerModal = ({ 
    visible, 
    onClose, 
    onConfirm, 
    initialDate, 
    accentColor = '#0177b8' 
}: { 
    visible: boolean; 
    onClose: () => void; 
    onConfirm: (date: string) => void; 
    initialDate?: string; 
    accentColor?: string;
}) => {
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedDay, setSelectedDay] = useState('');
    const [activePicker, setActivePicker] = useState<'year' | 'month' | 'day'>('year');

    // Generate data for pickers
    const currentYear = new NepaliDate(new Date()).getYear();
    const years = Array.from({ length: 121 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    
    // Get days based on selected month
    const getDaysForMonth = (month: number, year: number) => {
        if (!month) return Array.from({ length: 32 }, (_, i) => i + 1);
        let maxDays = 32;
        if (month === 2) maxDays = 31; // Jestha
        if (month === 8) maxDays = 30; // Bhadra
        return Array.from({ length: maxDays }, (_, i) => i + 1);
    };

    const days = getDaysForMonth(parseInt(selectedMonth), parseInt(selectedYear));

    // Initialize with initial date or current date
    React.useEffect(() => {
        if (visible) {
            if (initialDate) {
                const [year, month, day] = initialDate.split('-');
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
        }
    }, [visible, initialDate]);

    const handleConfirm = () => {
        if (!selectedYear || !selectedMonth || !selectedDay) return;
        
        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonth);
        const day = parseInt(selectedDay);

        if (year < 1970 || year > 2090) return;
        if (month < 1 || month > 12) return;
        
        let maxDays = 32;
        if (month === 2) maxDays = 31;
        if (month === 8) maxDays = 30;
        if (day < 1 || day > maxDays) return;

        const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onConfirm(formattedDate);
        onClose();
    };

    const renderYearPicker = () => (
        <ScrollView 
            style={styles.pickerScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pickerContent}
        >
            {years.map(year => (
                <TouchableOpacity
                    key={year}
                    style={[
                        styles.pickerItem,
                        selectedYear === year.toString() && { backgroundColor: accentColor + '15' }
                    ]}
                    onPress={() => setSelectedYear(year.toString())}
                >
                    <Text style={[
                        styles.pickerItemText,
                        selectedYear === year.toString() && { color: accentColor, fontWeight: '700' }
                    ]}>
                        {year}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    const renderMonthPicker = () => (
        <ScrollView 
            style={styles.pickerScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pickerContent}
        >
            {months.map(month => (
                <TouchableOpacity
                    key={month}
                    style={[
                        styles.pickerItem,
                        selectedMonth === month.toString() && { backgroundColor: accentColor + '15' }
                    ]}
                    onPress={() => setSelectedMonth(month.toString())}
                >
                    <Text style={[
                        styles.pickerItemText,
                        selectedMonth === month.toString() && { color: accentColor, fontWeight: '700' }
                    ]}>
                        {MONTH_NAMES[month - 1]}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    const renderDayPicker = () => (
        <ScrollView 
            style={styles.pickerScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pickerContent}
        >
            {days.map(day => (
                <TouchableOpacity
                    key={day}
                    style={[
                        styles.pickerItem,
                        selectedDay === day.toString() && { backgroundColor: accentColor + '15' }
                    ]}
                    onPress={() => setSelectedDay(day.toString())}
                >
                    <Text style={[
                        styles.pickerItemText,
                        selectedDay === day.toString() && { color: accentColor, fontWeight: '700' }
                    ]}>
                        {day}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <LinearGradient
                        colors={[accentColor, accentColor + 'dd']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.modalHeader}
                    >
                        <Text style={styles.modalTitle}>Select Date of Birth (BS)</Text>
                        <TouchableOpacity onPress={onClose} style={styles.modalClose}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </LinearGradient>

                    {/* Selected Date Display */}
                    {selectedYear && selectedMonth && selectedDay && (
                        <View style={styles.selectedDateContainer}>
                            <Text style={styles.selectedDateLabel}>Selected Date</Text>
                            <Text style={[styles.selectedDateText, { color: accentColor }]}>
                                {formatDisplayDate(`${selectedYear}-${selectedMonth}-${selectedDay}`)}
                            </Text>
                            {(() => {
                                const age = calculateAgeFromNepaliDate(`${selectedYear}-${selectedMonth}-${selectedDay}`);
                                return age !== null && (
                                    <Text style={styles.ageText}>
                                        Age: {age} years
                                    </Text>
                                );
                            })()}
                        </View>
                    )}

                    {/* Picker Tabs */}
                    <View style={styles.pickerTabs}>
                        <TouchableOpacity
                            style={[
                                styles.pickerTab,
                                activePicker === 'year' && { borderBottomColor: accentColor, borderBottomWidth: 2 }
                            ]}
                            onPress={() => setActivePicker('year')}
                        >
                            <Text style={[
                                styles.pickerTabText,
                                activePicker === 'year' && { color: accentColor, fontWeight: '700' }
                            ]}>Year</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.pickerTab,
                                activePicker === 'month' && { borderBottomColor: accentColor, borderBottomWidth: 2 }
                            ]}
                            onPress={() => setActivePicker('month')}
                        >
                            <Text style={[
                                styles.pickerTabText,
                                activePicker === 'month' && { color: accentColor, fontWeight: '700' }
                            ]}>Month</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.pickerTab,
                                activePicker === 'day' && { borderBottomColor: accentColor, borderBottomWidth: 2 }
                            ]}
                            onPress={() => setActivePicker('day')}
                        >
                            <Text style={[
                                styles.pickerTabText,
                                activePicker === 'day' && { color: accentColor, fontWeight: '700' }
                            ]}>Day</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Picker Content */}
                    <View style={styles.pickerContainer}>
                        {activePicker === 'year' && renderYearPicker()}
                        {activePicker === 'month' && renderMonthPicker()}
                        {activePicker === 'day' && renderDayPicker()}
                    </View>

                    {/* Footer Buttons */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.modalButtonCancel]}
                            onPress={onClose}
                        >
                            <Text style={styles.modalButtonCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.modalButtonConfirm, { backgroundColor: accentColor }]}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.modalButtonConfirmText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
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
    const [showPassword, setShowPassword] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

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
            } else if (formData.name.trim().length < 2) {
                newErrors.name = 'Name must be at least 2 characters';
            }

            if (!formData.dob) {
                newErrors.dob = 'Date of birth is required';
            } else {
                const age = calculateAgeFromNepaliDate(formData.dob);
                if (age !== null && age < 18) {
                    newErrors.dob = 'You must be at least 18 years old';
                }
            }
        }

        if (!formData.phone) {
            newErrors.phone = 'Phone number is required';
        } else if (!validatePhone(formData.phone)) {
            newErrors.phone = 'Enter a valid 10-digit number';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
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
        setShowDatePicker(true);
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
                await register({
                    phone: formData.phone,
                    fullName: formData.name.trim(),
                    password: formData.password,
                    dob: formData.dob,
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
                            router.replace('/(protected)/(mistri)');
                        }
                    } else if (userRole === 'user') {
                        if (!isOnboarded) {
                            router.replace('/onboarding/customer');
                        } else {
                            router.replace('/(protected)/(customer)');
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
            <StatusBar style="dark" />
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
                        {/* Back Button */}
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#666" />
                        </TouchableOpacity>

                        {/* Header with Gradient */}
                        <LinearGradient
                            colors={config.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.headerGradient}
                        >
                            <Image source={require('../../assets/images/logo-white.png')} style={styles.logo} />
                            <Text style={styles.brand}>ServeX</Text>
                            <Text style={styles.title}>{config.title}</Text>
                            <Text style={styles.subtitle}>{config.subtitle}</Text>
                        </LinearGradient>

                        {/* Mode Switch */}
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
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.switchText, 
                                    mode === 'login' && styles.switchTextActive
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
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.switchText, 
                                    mode === 'signup' && styles.switchTextActive
                                ]}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Form Fields */}
                        <View style={styles.formContainer}>
                            {mode === 'signup' && (
                                <>
                                    <View style={styles.inputGroup}>
                                        <View style={styles.inputIcon}>
                                            <Ionicons name="person-outline" size={20} color={config.accent} />
                                        </View>
                                        <TextInput
                                            placeholder="Full Name"
                                            placeholderTextColor="#999"
                                            value={formData.name}
                                            onChangeText={(text) => handleInputChange('name', text)}
                                            style={[styles.input, errors.name && styles.inputError]}
                                        />
                                    </View>
                                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                                    <View style={styles.inputGroup}>
                                        <View style={styles.inputIcon}>
                                            <Ionicons name="calendar-outline" size={20} color={config.accent} />
                                        </View>
                                        <TouchableOpacity 
                                            onPress={openDatePicker} 
                                            activeOpacity={0.7}
                                            style={styles.dateInputField}
                                        >
                                            <Text style={formData.dob ? styles.dateInputText : styles.dateInputPlaceholder}>
                                                {formData.dob ? formatDisplayDate(formData.dob) : 'Date of Birth (BS)'}
                                            </Text>
                                            <MaterialIcons name="calendar-today" size={22} color={config.accent} />
                                        </TouchableOpacity>
                                    </View>
                                    {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
                                </>
                            )}

                            <View style={styles.inputGroup}>
                                <View style={styles.inputIcon}>
                                    <Ionicons name="call-outline" size={20} color={config.accent} />
                                </View>
                                <View style={styles.phoneWrapper}>
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
                            </View>
                            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

                            <View style={styles.inputGroup}>
                                <View style={styles.inputIcon}>
                                    <Ionicons name="lock-closed-outline" size={20} color={config.accent} />
                                </View>
                                <TextInput
                                    placeholder="Password"
                                    placeholderTextColor="#999"
                                    value={formData.password}
                                    onChangeText={(text) => handleInputChange('password', text)}
                                    secureTextEntry={!showPassword}
                                    style={styles.input}
                                />
                                <TouchableOpacity 
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.passwordToggle}
                                >
                                    <Ionicons 
                                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                        size={20} 
                                        color="#999" 
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: config.accent }]}
                                onPress={handleContinue}
                                disabled={isLoading}
                                activeOpacity={0.8}
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
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Date Picker Modal */}
                <DatePickerModal
                    visible={showDatePicker}
                    onClose={() => setShowDatePicker(false)}
                    onConfirm={(date) => {
                        handleInputChange('dob', date);
                        const age = calculateAgeFromNepaliDate(date);
                        if (age !== null && age < 18) {
                            showToast('info', 'Age Notice', `You are ${age} years old. Minimum age is 18.`);
                        } else if (age !== null) {
                            showToast('success', 'Date Selected', `${formatDisplayDate(date)} (Age: ${age})`);
                        }
                    }}
                    initialDate={formData.dob}
                    accentColor={config.accent}
                />
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
        paddingBottom: 40,
    },
    backButton: {
        position: 'absolute',
        top: 16,
        left: 20,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    headerGradient: {
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    logo: {
        width: 70,
        height: 70,
        marginBottom: 12,
    },
    brand: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.5,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginTop: 12,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
    switchContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f2f6',
        borderRadius: 30,
        padding: 4,
        marginHorizontal: 24,
        marginTop: 24,
        marginBottom: 24,
    },
    switchButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 26,
    },
    switchText: {
        fontWeight: '600',
        color: '#666',
        fontSize: 15,
    },
    switchTextActive: {
        color: '#fff',
    },
    formContainer: {
        paddingHorizontal: 24,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        overflow: 'hidden',
    },
    inputIcon: {
        paddingLeft: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        paddingRight: 16,
        fontSize: 15,
        color: '#333',
    },
    inputError: {
        borderColor: '#ff3b30',
    },
    phoneWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    countryCode: {
        paddingLeft: 0,
        paddingRight: 8,
        justifyContent: 'center',
    },
    countryText: {
        fontWeight: '600',
        color: '#333',
        fontSize: 15,
    },
    phoneInput: {
        flex: 1,
        paddingVertical: 16,
        paddingRight: 16,
        fontSize: 15,
        color: '#333',
    },
    dateInputField: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingRight: 16,
    },
    dateInputText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    dateInputPlaceholder: {
        fontSize: 15,
        color: '#999',
    },
    passwordToggle: {
        paddingRight: 16,
    },
    errorText: {
        color: '#ff3b30',
        fontSize: 12,
        marginBottom: 12,
        marginTop: -8,
        marginLeft: 12,
    },
    button: {
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    forgotPassword: {
        alignItems: 'center',
        marginTop: 20,
    },
    forgotPasswordText: {
        color: '#666',
        fontSize: 14,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        width: width - 40,
        maxHeight: height * 0.8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    modalClose: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    selectedDateContainer: {
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    selectedDateLabel: {
        fontSize: 12,
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    selectedDateText: {
        fontSize: 18,
        fontWeight: '700',
    },
    ageText: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    pickerTabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    pickerTab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
    },
    pickerTabText: {
        fontSize: 15,
        color: '#666',
    },
    pickerContainer: {
        height: 280,
    },
    pickerScroll: {
        flex: 1,
    },
    pickerContent: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    pickerItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginVertical: 2,
        alignItems: 'center',
    },
    pickerItemText: {
        fontSize: 16,
        color: '#333',
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
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
});
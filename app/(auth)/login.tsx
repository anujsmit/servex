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
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import NepaliDate from 'nepali-date-converter';

import { useAuth } from '../../context/AuthContext';

interface Errors {
    name?: string | null;
    phone?: string | null;
    password?: string | null;
    dob?: string | null;
}

type RoleParam = 'user' | 'mistri';

const ROLE_CONFIG = {
    user: {
        accent: '#0177b8',
        title: 'Find a Service',
        subtitle: 'Login or create account',
    },
    mistri: {
        accent: '#179d2e',
        title: "I'm a Mistri",
        subtitle: 'Login or start earning',
    },
};

// Helper functions for Nepali date conversion
const convertNepaliToGregorian = (nepaliDateStr: string): Date | null => {
    try {
        const [year, month, day] = nepaliDateStr.split('-').map(Number);
        const nepaliDate = new NepaliDate(year, month - 1, day);
        return nepaliDate.toJsDate();
    } catch (error) {
        console.error('Date conversion error:', error);
        return null;
    }
};

const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';

    try {
        const [year, month, day] = dateStr.split('-').map(Number);
        const nepaliDate = new NepaliDate(year, month - 1, day);
        const monthNames = [
            'Baisakh', 'Jestha', 'Ashad', 'Shrawan', 'Bhadra', 'Ashwin',
            'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
        ];
        return `${monthNames[month - 1]} ${day}, ${year} BS`;
    } catch (error) {
        return dateStr;
    }
};

// Get current Nepali date
const getCurrentNepaliDate = (): string => {
    const today = new Date();
    const nepaliDate = new NepaliDate(today);
    const year = nepaliDate.getYear();
    const month = String(nepaliDate.getMonth() + 1).padStart(2, '0');
    const day = String(nepaliDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function LoginScreen() {
    const router = useRouter();
    const { loginWithPassword, register } = useAuth();
    const params = useLocalSearchParams<{ role?: string }>();

    const role: RoleParam = params.role === 'mistri' ? 'mistri' : 'user';
    const config = ROLE_CONFIG[role];

    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Errors>({});

    // Nepali date picker states
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [nepaliYear, setNepaliYear] = useState('');
    const [nepaliMonth, setNepaliMonth] = useState('');
    const [nepaliDay, setNepaliDay] = useState('');

    // Dropdown selectors for easier input
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showDayPicker, setShowDayPicker] = useState(false);

    const years = Array.from({ length: 121 }, (_, i) => 1970 + i); // 1970-2090 BS
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 32 }, (_, i) => i + 1);

    const monthNames = [
        'Baisakh', 'Jestha', 'Ashad', 'Shrawan', 'Bhadra', 'Ashwin',
        'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
    ];

    const validatePhone = (phoneNumber: string) => {
        return /^[6-9]\d{9}$/.test(phoneNumber);
    };

    const handlePhoneChange = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 10) {
            setPhone(cleaned);
        }
    };

    const handleDatePress = () => {
        if (dob) {
            const [year, month, day] = dob.split('-');
            setNepaliYear(year);
            setNepaliMonth(month);
            setNepaliDay(day);
        } else {
            const currentDate = getCurrentNepaliDate();
            const [year, month, day] = currentDate.split('-');
            setNepaliYear(year);
            setNepaliMonth(month);
            setNepaliDay(day);
        }
        setShowDatePicker(true);
    };

    const handleNepaliDateSubmit = () => {
        if (!nepaliYear || !nepaliMonth || !nepaliDay) {
            Alert.alert('Error', 'Please select complete Nepali date');
            return;
        }

        const year = parseInt(nepaliYear);
        const month = parseInt(nepaliMonth);
        const day = parseInt(nepaliDay);

        if (year < 1970 || year > 2090) {
            Alert.alert('Error', 'Please select year between 1970 and 2090 BS');
            return;
        }

        if (month < 1 || month > 12) {
            Alert.alert('Error', 'Please select month between 1 and 12');
            return;
        }

        if (day < 1 || day > 32) {
            Alert.alert('Error', 'Please select day between 1 and 32');
            return;
        }

        try {
            const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const gregorianDate = convertNepaliToGregorian(formattedDate);
            if (gregorianDate) {
                setDob(formattedDate);
                setShowDatePicker(false);

                if (errors.dob) {
                    setErrors(prev => ({ ...prev, dob: undefined }));
                }
            } else {
                Alert.alert('Error', 'Invalid Nepali date');
            }
        } catch (error) {
            Alert.alert('Error', 'Invalid Nepali date');
        }
    };

    const handleContinue = async () => {
        setErrors({});
        const localErrors: Errors = {};

        if (mode === 'signup') {
            if (!name.trim()) {
                localErrors.name = 'Full name is required';
            }
            if (!dob.trim()) {
                localErrors.dob = 'Date of birth is required';
            }
        }

        if (!phone) {
            localErrors.phone = 'Phone number required';
        } else if (!validatePhone(phone)) {
            localErrors.phone = 'Enter valid 10-digit number';
        }

        if (!password) {
            localErrors.password = 'Password is required';
        } else if (password.length < 6) {
            localErrors.password = 'Password must be at least 6 characters';
        }

        if (Object.keys(localErrors).length > 0) {
            setErrors(localErrors);
            return;
        }

        try {
            setIsLoading(true);

            if (mode === 'signup') {
                let finalDob = dob;
                const gregorianDate = convertNepaliToGregorian(dob);
                if (gregorianDate) {
                    finalDob = `${gregorianDate.getFullYear()}-${String(gregorianDate.getMonth() + 1).padStart(2, '0')}-${String(gregorianDate.getDate()).padStart(2, '0')}`;
                }

                await register({
                    phone,
                    fullName: name,
                    password,
                    dob: finalDob,
                    role,
                });

                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.push({
                    pathname: '/verify-otp',
                    params: { phone, role, mode },
                });
            } else {
                const status = await loginWithPassword(phone, password);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Check if user needs verification
                if (status.isVerified === false) {
                    router.push({
                        pathname: '/verify-otp',
                        params: { phone, role, mode: 'login' },
                    });
                    return;
                }

                // User is verified, now check role and onboarding status
                if (status.user) {
                    const userRole = status.user.role;
                    const isOnboarded = status.user.is_onboarded || status.user.isOnboarded;
                    const approvalStatus = status.user.approvalStatus || status.user.approval_status;

                    if (userRole === 'mistri') {
                        // Check if profile exists and is completed
                        const hasMistriProfile = status.user.hasMistriProfile || status.user.mistriProfile;

                        // Case 1: Not onboarded at all - needs full onboarding
                        if (!isOnboarded) {
                            router.replace('/onboarding/mistri');
                        }
                        // Case 2: Onboarded but not approved - show pending approval
                        else if (approvalStatus !== 'approved') {
                            router.replace('/pending-approval');
                        }
                        // Case 3: Fully approved - go to mistri dashboard
                        else {
                            router.replace('/(mistri)');
                        }
                    }
                    else if (userRole === 'user') {
                        // Customer routing
                        if (!isOnboarded) {
                            router.replace('/onboarding/customer');
                        } else {
                            router.replace('/(customer)');
                        }
                    }
                    else {
                        // Fallback for other roles or no role
                        router.replace('/');
                    }
                } else {
                    // No user data - something went wrong
                    Alert.alert('Error', 'Unable to determine user status. Please try again.');
                }
            }
        } catch (error: any) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Authentication Error', error.message || 'An error occurred. Please try again.');
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
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
                        <Text style={styles.brand}>ServeX</Text>
                        <Text style={styles.title}>{config.title}</Text>
                        <Text style={styles.subtitle}>{config.subtitle}</Text>
                    </View>

                    <View style={styles.switchContainer}>
                        <TouchableOpacity
                            style={[styles.switchButton, mode === 'login' && { backgroundColor: config.accent }]}
                            onPress={() => {
                                setMode('login');
                                setErrors({});
                            }}
                        >
                            <Text style={[styles.switchText, mode === 'login' && { color: '#fff' }]}>Login</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.switchButton, mode === 'signup' && { backgroundColor: config.accent }]}
                            onPress={() => {
                                setMode('signup');
                                setErrors({});
                            }}
                        >
                            <Text style={[styles.switchText, mode === 'signup' && { color: '#fff' }]}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>

                    {mode === 'signup' && (
                        <>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Full Name</Text>
                                <TextInput
                                    placeholder="Your full name"
                                    value={name}
                                    onChangeText={setName}
                                    style={styles.input}
                                />
                                {errors.name && (
                                    <Text style={styles.error}>{errors.name}</Text>
                                )}
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Date of Birth</Text>

                                <TouchableOpacity onPress={handleDatePress} activeOpacity={0.7}>
                                    <View style={styles.dateInput}>
                                        <Text style={dob ? styles.dateText : styles.placeholderText}>
                                            {dob ? formatDisplayDate(dob) : 'Select Date of Birth'}
                                        </Text>
                                        <Text style={styles.calendarIcon}>📅</Text>
                                    </View>
                                </TouchableOpacity>

                                {errors.dob && (
                                    <Text style={styles.error}>{errors.dob}</Text>
                                )}
                            </View>
                        </>
                    )}

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <View style={styles.phoneWrapper}>
                            <View style={styles.countryCode}>
                                <Text style={styles.countryText}>+977</Text>
                            </View>
                            <TextInput
                                placeholder="98XXXXXXXX"
                                value={phone}
                                onChangeText={handlePhoneChange}
                                keyboardType="phone-pad"
                                maxLength={10}
                                style={styles.phoneInput}
                            />
                        </View>
                        {errors.phone && (
                            <Text style={styles.error}>{errors.phone}</Text>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <TextInput
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            style={styles.input}
                        />
                        {errors.password && (
                            <Text style={styles.error}>{errors.password}</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: config.accent }]}
                        onPress={handleContinue}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>
                            {isLoading ? 'Processing...' : mode === 'login' ? 'Login' : 'Create Account'}
                        </Text>
                    </TouchableOpacity>
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

                        <View style={styles.nepaliDateContainer}>
                            <View style={styles.nepaliInputRow}>
                                <View style={styles.nepaliInputGroup}>
                                    <Text style={styles.nepaliInputLabel}>Year (BS)</Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => setShowYearPicker(!showYearPicker)}
                                    >
                                        <Text style={styles.dropdownText}>
                                            {nepaliYear || 'Select Year'}
                                        </Text>
                                        <Text style={styles.dropdownArrow}>▼</Text>
                                    </TouchableOpacity>
                                    {showYearPicker && (
                                        <ScrollView style={styles.dropdownList}>
                                            {years.map(year => (
                                                <TouchableOpacity
                                                    key={year}
                                                    style={styles.dropdownItem}
                                                    onPress={() => {
                                                        setNepaliYear(year.toString());
                                                        setShowYearPicker(false);
                                                    }}
                                                >
                                                    <Text style={styles.dropdownItemText}>{year}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    )}
                                </View>

                                <View style={styles.nepaliInputGroup}>
                                    <Text style={styles.nepaliInputLabel}>Month</Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => setShowMonthPicker(!showMonthPicker)}
                                    >
                                        <Text style={styles.dropdownText}>
                                            {nepaliMonth ? `${monthNames[parseInt(nepaliMonth) - 1]} (${nepaliMonth})` : 'Select Month'}
                                        </Text>
                                        <Text style={styles.dropdownArrow}>▼</Text>
                                    </TouchableOpacity>
                                    {showMonthPicker && (
                                        <ScrollView style={styles.dropdownList}>
                                            {months.map(month => (
                                                <TouchableOpacity
                                                    key={month}
                                                    style={styles.dropdownItem}
                                                    onPress={() => {
                                                        setNepaliMonth(month.toString());
                                                        setShowMonthPicker(false);
                                                    }}
                                                >
                                                    <Text style={styles.dropdownItemText}>
                                                        {monthNames[month - 1]} ({month})
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    )}
                                </View>

                                <View style={styles.nepaliInputGroup}>
                                    <Text style={styles.nepaliInputLabel}>Day</Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => setShowDayPicker(!showDayPicker)}
                                    >
                                        <Text style={styles.dropdownText}>
                                            {nepaliDay || 'Select Day'}
                                        </Text>
                                        <Text style={styles.dropdownArrow}>▼</Text>
                                    </TouchableOpacity>
                                    {showDayPicker && (
                                        <ScrollView style={styles.dropdownList}>
                                            {days.map(day => (
                                                <TouchableOpacity
                                                    key={day}
                                                    style={styles.dropdownItem}
                                                    onPress={() => {
                                                        setNepaliDay(day.toString());
                                                        setShowDayPicker(false);
                                                    }}
                                                >
                                                    <Text style={styles.dropdownItemText}>{day}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    )}
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: config.accent, marginTop: 20 }]}
                                onPress={handleNepaliDateSubmit}
                            >
                                <Text style={styles.modalButtonText}>Confirm Date</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
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
        padding: 28,
        flexGrow: 1,
    },
    backText: {
        fontSize: 16,
        marginBottom: 20,
        color: '#666',
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        width: 70,
        height: 70,
        marginBottom: 12,
    },
    brand: {
        fontSize: 30,
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
        marginBottom: 30,
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
    phoneWrapper: {
        flexDirection: 'row',
        borderWidth: 1.5,
        borderColor: '#e5e5e5',
        borderRadius: 12,
        overflow: 'hidden',
    },
    countryCode: {
        paddingHorizontal: 16,
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
    },
    countryText: {
        fontWeight: '700',
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
    },
    error: {
        color: 'red',
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
        fontSize: 16,
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
        maxWidth: 400,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalClose: {
        fontSize: 24,
        color: '#666',
    },
    modalButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    nepaliDateContainer: {
        paddingVertical: 10,
    },
    nepaliInputRow: {
        flexDirection: 'column',
        gap: 15,
    },
    nepaliInputGroup: {
        width: '100%',
    },
    nepaliInputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    dropdownButton: {
        borderWidth: 1.5,
        borderColor: '#e5e5e5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fafafa',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 16,
        color: '#000',
    },
    dropdownArrow: {
        fontSize: 12,
        color: '#666',
    },
    dropdownList: {
        position: 'absolute',
        top: 70,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 8,
        maxHeight: 200,
        zIndex: 1000,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#333',
    },
});
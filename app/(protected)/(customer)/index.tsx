import React, {
    useMemo,
    useCallback,
    useEffect,
    useState,
    useRef,
} from 'react';

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    Dimensions,
    RefreshControl,
} from 'react-native';

import { SafeAreaContainer } from '../../../components/SafeAreaContainer';

import {
    customerBrand as B,
    customerDashboardColors as C,
    customerDashboardElevation as ELEV,
} from '../../../lib/customerDashboardTokens';

import { useAuth } from '../../../context/AuthContext';

import { useLocation } from '../../../context/LocationContext';

import { useRouter } from 'expo-router';

import { MaterialIcons } from '@expo/vector-icons';

import { useCustomerRequestsQuery } from '../../../hooks/queries';

import { HeroBanner } from '../../../components/HeroBanner';

const { width: screenWidth } = Dimensions.get('window');

interface Service {
    id: number;
    service_name: string;
    description?: string;
}

// Color palette for service cards
const serviceColors = [
    { bg: '#FFE4E1', icon: '#FF6B6B' }, // Electric - Coral
    { bg: '#E0F3FF', icon: '#4A90E2' }, // Plumbing - Blue
    { bg: '#E8F5E9', icon: '#4CAF50' }, // Painting - Green
    { bg: '#FFF3E0', icon: '#FF9800' }, // Cleaning - Orange
    { bg: '#F3E5F5', icon: '#9C27B0' }, // Carpentry - Purple
    { bg: '#FFE0F0', icon: '#E91E63' }, // AC - Pink
    { bg: '#E0F7FA', icon: '#00BCD4' }, // General - Teal
    { bg: '#FFF9C4', icon: '#FDD835' }, // Maintenance - Yellow
];

// Skeleton Loader Component
const ServiceSkeleton = () => {
    const animatedValue = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0.3, 0.7],
        outputRange: [0.3, 0.7],
    });

    return (
        <View style={styles.serviceCard}>
            <Animated.View style={[styles.skeletonIcon, { opacity }]} />
            <Animated.View style={[styles.skeletonText, { opacity, width: '80%', marginTop: 10 }]} />
        </View>
    );
};

const RequestSkeleton = () => {
    const animatedValue = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0.3, 0.7],
        outputRange: [0.3, 0.7],
    });

    return (
        <View style={styles.requestCard}>
            <View style={styles.requestHeader}>
                <Animated.View style={[styles.skeletonIconSmall, { opacity }]} />
                <View style={styles.requestInfo}>
                    <Animated.View style={[styles.skeletonText, { opacity, width: '60%' }]} />
                    <Animated.View style={[styles.skeletonText, { opacity, width: '80%', marginTop: 8 }]} />
                </View>
                <Animated.View style={[styles.skeletonBadge, { opacity }]} />
            </View>
        </View>
    );
};

export default function CustomerDashboard() {
    const { user } = useAuth();
    const { address, isLoading: locationLoading, refetch: refetchLocation } = useLocation();
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const brandStyles = useMemo(
        () => ({
            avatar: {
                backgroundColor: B.accent,
                boxShadow: `0 6px 18px rgba(${B.accentRgb}, 0.28), 0 2px 6px rgba(15, 23, 42, 0.06)`,
            },
            seeAll: {
                color: B.accent,
            },
        }),
        []
    );

    const {
        data: requests = [],
        isLoading: requestsLoading,
        refetch: refetchRequests,
    } = useCustomerRequestsQuery();

    useEffect(() => {
        fetchServices();
    }, []);

    // Refresh data when screen comes into focus
    useEffect(() => {
        const unsubscribe = router.events?.on('focus', () => {
            refreshAllData();
        });
        return unsubscribe;
    }, [router]);

    const fetchServices = async () => {
        try {
            setServicesLoading(true);
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/services`
            );
            const data = await response.json();

            if (response.ok) {
                if (Array.isArray(data)) {
                    setServices(data);
                } else if (Array.isArray(data.services)) {
                    setServices(data.services);
                } else if (Array.isArray(data.data)) {
                    setServices(data.data);
                } else {
                    setServices([]);
                }
            }
        } catch (error) {
            console.log('Failed to fetch services:', error);
            setServices([]);
        } finally {
            setServicesLoading(false);
        }
    };

    const refreshAllData = async () => {
        setRefreshing(true);
        
        // Run all refresh operations in parallel
        await Promise.all([
            fetchServices(),
            refetchRequests(),
            refetchLocation(),
        ]);
        
        setRefreshing(false);
    };

    const onRefresh = useCallback(() => {
        refreshAllData();
    }, []);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const getServiceIcon = (serviceName: string) => {
        const name = serviceName?.toLowerCase() || '';

        if (name.includes('electric')) return 'electrical-services';
        if (name.includes('plumb')) return 'plumbing';
        if (name.includes('paint')) return 'format-paint';
        if (name.includes('clean')) return 'cleaning-services';
        if (name.includes('carpent')) return 'handyman';
        if (name.includes('ac')) return 'ac-unit';
        if (name.includes('repair')) return 'build';
        if (name.includes('install')) return 'construction';
        return 'build';
    };

    // Get color based on service name or index
    const getServiceColor = (serviceName: string, index: number) => {
        const name = serviceName?.toLowerCase() || '';

        if (name.includes('electric')) return serviceColors[0];
        if (name.includes('plumb')) return serviceColors[1];
        if (name.includes('paint')) return serviceColors[2];
        if (name.includes('clean')) return serviceColors[3];
        if (name.includes('carpent')) return serviceColors[4];
        if (name.includes('ac')) return serviceColors[5];
        if (name.includes('maintenance')) return serviceColors[7];
        return serviceColors[index % serviceColors.length];
    };

    const getStatusStyle = useCallback((status: string) => {
        switch (status) {
            case 'pending':
                return { backgroundColor: '#fef3c7', color: '#d97706' };
            case 'assigned':
                return { backgroundColor: '#dbeafe', color: B.accent };
            case 'completed':
                return { backgroundColor: '#d1fae5', color: '#059669' };
            case 'canceled':
                return { backgroundColor: '#fee2e2', color: '#dc2626' };
            default:
                return { backgroundColor: '#f3f4f6', color: '#6b7280' };
        }
    }, []);

    const openServiceCategory = (service: Service) => {
        router.push({
            pathname: '/services/[id]',
            params: {
                id: service.id.toString(),
                serviceName: service.serviceName,
            },
        });
    };

    return (
        <SafeAreaContainer style={styles.safeRoot} showBottomNav>
            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.greeting}>
                        Hello, {user?.fullName || 'Customer'}
                    </Text>
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {locationLoading ? 'Detecting location...' : address}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.avatar, brandStyles.avatar]}
                    onPress={() => router.push('/(protected)/(customer)/settings')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.avatarText}>
                        {user?.fullName ? getInitials(user.fullName) : 'U'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.content}
                contentContainerStyle={styles.scrollInner}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[B.accent]} // Android
                        tintColor={B.accent} // iOS
                        title="Pull to refresh" // iOS
                        titleColor={B.accent} // iOS
                        progressBackgroundColor="#ffffff"
                    />
                }
            >
                {/* HERO */}
                <View style={styles.heroWrapper}>
                    <HeroBanner />
                </View>

                {/* SERVICES SECTION */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            What are you looking for?
                        </Text>
                    </View>

                    {servicesLoading && !refreshing ? (
                        <View style={styles.servicesGrid}>
                            {[1, 2, 3, 4, 5, 6].map((item) => (
                                <ServiceSkeleton key={item} />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.servicesGrid}>
                            {services.map((service, index) => {
                                const colors = getServiceColor(service.serviceName, index);
                                return (
                                    <TouchableOpacity
                                        key={service.id}
                                        style={styles.serviceCard}
                                        activeOpacity={0.85}
                                        onPress={() => openServiceCategory(service)}
                                    >
                                        <View style={[styles.serviceIconContainer, { backgroundColor: colors.bg }]}>
                                            <MaterialIcons
                                                name={getServiceIcon(service.serviceName) as any}
                                                size={28}
                                                color={colors.icon}
                                            />
                                        </View>
                                        <Text style={styles.serviceName} numberOfLines={2}>
                                            {service.serviceName}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* RECENT ACTIVITIES */}
                <View style={[styles.section, styles.bottomSpacing]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Activities</Text>
                        {requests.length > 0 && (
                            <TouchableOpacity
                                onPress={() => router.push('/(protected)/(customer)/requests')}
                            >
                                <Text style={[styles.seeAllText, brandStyles.seeAll]}>
                                    View all
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {requestsLoading && !refreshing ? (
                        <View style={styles.requestsContainer}>
                            {[1, 2, 3].map((item) => (
                                <RequestSkeleton key={item} />
                            ))}
                        </View>
                    ) : requests.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="event-note" size={42} color={C.muted} />
                            <Text style={styles.emptyTitle}>No bookings yet</Text>
                            <Text style={styles.emptySubtitle}>Book your first service now</Text>
                        </View>
                    ) : (
                        <View style={styles.requestsContainer}>
                            {requests.slice(0, 3).map((request: any) => {
                                const statusStyle = getStatusStyle(request.status);
                                const colors = getServiceColor(request.type, 0);
                                return (
                                    <TouchableOpacity
                                        key={request.id}
                                        style={styles.requestCard}
                                        activeOpacity={0.7}
                                        onPress={() => router.push(`/(protected)/(customer)/request/${request.id}`)}
                                    >
                                        <View style={styles.requestHeader}>
                                            <View style={[styles.requestIcon, { backgroundColor: colors.bg }]}>
                                                <MaterialIcons
                                                    name={getServiceIcon(request.type) as any}
                                                    size={24}
                                                    color={colors.icon}
                                                />
                                            </View>
                                            <View style={styles.requestInfo}>
                                                <Text style={styles.requestType}>{request.type}</Text>
                                                <Text style={styles.requestAddress} numberOfLines={1}>
                                                    {request.address}
                                                </Text>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                                                <Text style={[styles.statusText, { color: statusStyle.color }]}>
                                                    {request.status}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaContainer>
    );
}

const styles = StyleSheet.create({
    safeRoot: {
        flex: 1,
        backgroundColor: '#f5f7fb',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f2f5',
    },
    headerLeft: {
        flex: 1,
    },
    greeting: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.3,
    },
    subtitle: {
        marginTop: 4,
        fontSize: 13,
        color: '#6b7280',
        letterSpacing: -0.2,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    content: {
        flex: 1,
    },
    scrollInner: {
        paddingBottom: 40,
        paddingTop: 0,
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.3,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 12,
        paddingHorizontal: 0,
    },
    serviceCard: {
        width: (screenWidth - 52) / 3.2,
        backgroundColor: '#fff',
        borderRadius: 18,
        paddingVertical: 18,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f0f2f5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    serviceIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    serviceName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
        letterSpacing: -0.2,
        lineHeight: 16,
    },
    requestsContainer: {
        gap: 12,
    },
    requestCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f0f2f5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    requestHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    requestIcon: {
        width: 52,
        height: 52,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    requestInfo: {
        flex: 1,
    },
    requestType: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.2,
    },
    requestAddress: {
        marginTop: 4,
        fontSize: 12,
        color: '#6b7280',
        letterSpacing: -0.2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    emptyState: {
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingVertical: 48,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f0f2f5',
    },
    emptyTitle: {
        marginTop: 14,
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    emptySubtitle: {
        marginTop: 6,
        fontSize: 13,
        color: '#6b7280',
    },
    bottomSpacing: {
        marginBottom: 30,
    },
    // Skeleton styles
    skeletonIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#e5e7eb',
    },
    skeletonIconSmall: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: '#e5e7eb',
    },
    skeletonText: {
        height: 12,
        borderRadius: 6,
        backgroundColor: '#e5e7eb',
    },
    skeletonBadge: {
        width: 70,
        height: 30,
        borderRadius: 12,
        backgroundColor: '#e5e7eb',
    },
    heroWrapper: {
        marginHorizontal: 0,
        marginTop: 0,
        marginBottom: 8,
    },
});
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
    TextInput,
    Modal,
    Image,
} from 'react-native';

import { SafeAreaContainer } from '../../../components/SafeAreaContainer';
import { customerBrand as B, customerDashboardColors as C } from '../../../lib/customerDashboardTokens';
import { useAuth } from '../../../context/AuthContext';
import { useLocation } from '../../../context/LocationContext';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { HeroBanner } from '../../../components/HeroBanner';
import { WebView } from 'react-native-webview';

const { width: screenWidth } = Dimensions.get('window');

interface ServiceCategory {
    id: number;
    serviceName: string;
    description?: string;
    customIconUrl?: string | null;
    iconColor?: string;
    mapIconColor?: string;
    isActive?: boolean;
}

interface PlatformService {
    id: string;
    name: string;
    description: string | null;
    price: string;
    imageUrl: string | null;
    serviceId?: number;
    categoryName?: string;
}

const CategorySkeleton = () => {
    const animatedValue = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(animatedValue, { toValue: 0.3, duration: 800, useNativeDriver: true }),
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
        <View style={styles.categoryCard}>
            <Animated.View style={[styles.skeletonIcon, { opacity }]} />
            <Animated.View style={[styles.skeletonText, { opacity, width: '80%', marginTop: 10 }]} />
        </View>
    );
};

const PlatformServiceSkeleton = () => {
    const animatedValue = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(animatedValue, { toValue: 0.3, duration: 800, useNativeDriver: true }),
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
        <View style={styles.platformServiceCard}>
            <Animated.View style={[styles.skeletonPlatformIcon, { opacity }]} />
            <Animated.View style={[styles.skeletonText, { opacity, width: '60%', marginTop: 8 }]} />
            <Animated.View style={[styles.skeletonText, { opacity, width: '40%', marginTop: 4 }]} />
        </View>
    );
};

export default function CustomerDashboard() {
    const { user } = useAuth();
    const { address, isLoading: locationLoading, refetch: refetchLocation } = useLocation();
    const router = useRouter();
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [platformServices, setPlatformServices] = useState<PlatformService[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [platformServicesLoading, setPlatformServicesLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [filteredCategories, setFilteredCategories] = useState<ServiceCategory[]>([]);
    const scrollViewRef = useRef<ScrollView>(null);

    const brandStyles = useMemo(() => ({
        avatar: {
            backgroundColor: B.accent,
        },
        seeAll: { color: B.accent },
        searchBorder: { borderColor: B.accent },
    }), []);

    useEffect(() => {
        fetchCategories();
        fetchPlatformServices();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = categories.filter(category =>
                category.serviceName?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredCategories(filtered);
        } else {
            setFilteredCategories(categories);
        }
    }, [searchQuery, categories]);

    const fetchCategories = async () => {
        try {
            setCategoriesLoading(true);
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/services`);
            const data = await response.json();

            if (response.ok) {
                let categoriesData = [];
                if (Array.isArray(data)) categoriesData = data;
                else if (Array.isArray(data.categories)) categoriesData = data.categories;
                else if (Array.isArray(data.services)) categoriesData = data.services;
                else if (Array.isArray(data.data)) categoriesData = data.data;

                // Filter only active categories
                const activeCategories = categoriesData.filter(cat => cat.isActive !== false);
                setCategories(activeCategories);
                setFilteredCategories(activeCategories);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.log('Failed to fetch categories:', error);
            setCategories([]);
        } finally {
            setCategoriesLoading(false);
        }
    };

    const fetchPlatformServices = async () => {
        try {
            setPlatformServicesLoading(true);
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/platform-services`);
            const data = await response.json();

            if (response.ok) {
                if (data.categories && Array.isArray(data.categories)) {
                    const allServices: PlatformService[] = [];
                    data.categories.forEach((category: any) => {
                        if (category.services && Array.isArray(category.services)) {
                            category.services.forEach((service: any) => {
                                allServices.push({
                                    id: service.id,
                                    name: service.name,
                                    description: service.description,
                                    price: service.price,
                                    imageUrl: service.imageUrl,
                                    serviceId: category.categoryId,
                                    categoryName: category.categoryName,
                                });
                            });
                        }
                    });
                    setPlatformServices(allServices.slice(0, 8));
                } else if (data.services && Array.isArray(data.services)) {
                    setPlatformServices(data.services.slice(0, 8));
                } else {
                    setPlatformServices([]);
                }
            } else {
                setPlatformServices([]);
            }
        } catch (error) {
            console.log('Failed to fetch platform services:', error);
            setPlatformServices([]);
        } finally {
            setPlatformServicesLoading(false);
        }
    };

    const refreshAllData = async () => {
        setRefreshing(true);
        await Promise.all([fetchCategories(), fetchPlatformServices(), refetchLocation()]);
        setRefreshing(false);
    };

    const onRefresh = useCallback(() => { refreshAllData(); }, []);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const getCategoryColor = (category: ServiceCategory, index: number) => {
        if (category.iconColor) return category.iconColor;
        if (category.mapIconColor) return category.mapIconColor;
        const colors = ['#FF6B6B', '#4A90E2', '#4CAF50', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4', '#FDD835'];
        return colors[index % colors.length];
    };

    const openCategory = (category: ServiceCategory) => {
        router.push({
            pathname: '/category/[id]',
            params: {
                id: category.id.toString(),
                name: category.serviceName,
                serviceId: category.id
            },
        });
    };

    const openPlatformService = (service: PlatformService) => {
        router.push({
            pathname: '/service-details/[id]',
            params: {
                id: service.id,
                name: service.name,
                price: service.price,
                description: service.description || '',
                imageUrl: service.imageUrl || ''
            },
        });
    };

    // 1. Search Bar
    const renderSearchBar = () => (
        <View style={styles.searchContainer}>
            <View style={[styles.searchBar, brandStyles.searchBorder]}>
                <Feather name="search" size={20} color="#9ca3af" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search for services..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    // 2. Hero Banner (Ad 1)
    const renderHeroBanner = () => (
        <View style={styles.heroWrapper}>
            <HeroBanner />
        </View>
    );

    // 3. What are you looking for? - Categories with custom icons
    const renderCategories = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>What are you looking for?</Text>
            </View>

            {categoriesLoading && !refreshing ? (
                <View style={styles.categoriesGrid}>
                    {[1, 2, 3, 4, 5, 6].map((item) => <CategorySkeleton key={item} />)}
                </View>
            ) : filteredCategories.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="search-off" size={42} color={C.muted} />
                    <Text style={styles.emptyTitle}>No categories found</Text>
                    <Text style={styles.emptySubtitle}>Try searching for something else</Text>
                </View>
            ) : (
                <View style={styles.categoriesGrid}>
                    {filteredCategories.map((category, index) => {
                        const iconColor = getCategoryColor(category, index);
                        return (
                            <TouchableOpacity
                                key={category.id}
                                style={styles.categoryCard}
                                activeOpacity={0.85}
                                onPress={() => openCategory(category)}
                            >
                                <View style={[styles.categoryIconContainer, { backgroundColor: `${iconColor}20` }]}>
                                    {category.customIconUrl ? (
                                        // Show custom uploaded image
                                        <Image
                                            source={{ uri: category.customIconUrl }}
                                            style={{ width: 40, height: 40 }}
                                            resizeMode="contain"
                                        />
                                    ) : (
                                        // Fallback to first letter of service name
                                        <Text style={{ fontSize: 24, fontWeight: '600', color: iconColor }}>
                                            {category.serviceName?.charAt(0).toUpperCase()}
                                        </Text>
                                    )}
                                </View>
                                <Text style={styles.categoryName} numberOfLines={2}>
                                    {category.serviceName}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </View>
    );

    // 4. Video Banner (Ad 2)
    const renderVideoBanner = () => (
        <View style={styles.videoBannerContainer}>
            <TouchableOpacity
                style={styles.videoCard}
                onPress={() => setShowVideoModal(true)}
                activeOpacity={0.9}
            >
                <View style={styles.videoThumbnail}>
                    <MaterialIcons name="play-circle-fill" size={60} color={B.accent} />
                    <Text style={styles.videoTitle}>Watch Video</Text>
                    <Text style={styles.videoSubtitle}>How ServeX Works</Text>
                </View>
                <View style={styles.watchButton}>
                    <Text style={[styles.watchButtonText, { color: B.accent }]}>▶ Watch Now</Text>
                </View>
            </TouchableOpacity>
        </View>
    );

    // 5. Platform Services
    const renderPlatformServices = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Popular Services</Text>
                <TouchableOpacity onPress={() => router.push('/platform-services')}>
                    <Text style={[styles.seeAllText, brandStyles.seeAll]}>View all</Text>
                </TouchableOpacity>
            </View>

            {platformServicesLoading && !refreshing ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.platformServicesScroll}
                >
                    {[1, 2, 3, 4].map((item) => <PlatformServiceSkeleton key={item} />)}
                </ScrollView>
            ) : platformServices.length === 0 ? (
                <View style={styles.emptyPlatformContainer}>
                    <MaterialIcons name="info-outline" size={32} color={C.muted} />
                    <Text style={styles.emptySubtitle}>No services available</Text>
                </View>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.platformServicesScroll}
                >
                    {platformServices.map((service) => (
                        <TouchableOpacity
                            key={service.id}
                            style={styles.platformServiceCard}
                            activeOpacity={0.85}
                            onPress={() => openPlatformService(service)}
                        >
                            {service.imageUrl ? (
                                <Image
                                    source={{ uri: service.imageUrl }}
                                    style={styles.platformServiceImage}
                                />
                            ) : (
                                <View style={[styles.platformServiceIconPlaceholder, { backgroundColor: `${B.accent}15` }]}>
                                    <MaterialIcons name="build" size={28} color={B.accent} />
                                </View>
                            )}
                            <Text style={styles.platformServiceName} numberOfLines={1}>
                                {service.name}
                            </Text>
                            <Text style={styles.platformServicePrice}>
                                रु {parseFloat(service.price).toLocaleString()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );

    return (
        <SafeAreaContainer style={styles.safeRoot} showBottomNav>
            {/* HEADER - Hello User */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.greeting}>Hello, {user?.fullName?.split(' ')[0] || 'Customer'} 👋</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {locationLoading ? 'Detecting location...' : address || 'Welcome back'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.avatar, brandStyles.avatar]}
                    onPress={() => router.push('/(protected)/(customer)/settings')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.avatarText}>{user?.fullName ? getInitials(user.fullName) : 'U'}</Text>
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
                        colors={[B.accent]}
                        tintColor={B.accent}
                        title="Pull to refresh"
                        titleColor={B.accent}
                        progressBackgroundColor="#ffffff"
                    />
                }
            >
                {/* 1. Search Bar */}
                {renderSearchBar()}

                {/* 2. Ads 1 - Hero Banner */}
                {renderHeroBanner()}

                {/* 3. What are you looking for - Categories with Custom Icons */}
                {renderCategories()}

                {/* 4. Ads 2 - Video Banner */}
                {renderVideoBanner()}

                {/* 5. Popular Services - Platform Services */}
                {renderPlatformServices()}
            </ScrollView>

            {/* Video Modal */}
            <Modal
                visible={showVideoModal}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowVideoModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>How ServeX Works</Text>
                        <TouchableOpacity onPress={() => setShowVideoModal(false)}>
                            <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <WebView
                        source={{ uri: 'https://www.youtube.com/embed/NGO-Wuj066g' }}
                        style={styles.webview}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        allowsFullscreenVideo={true}
                    />
                </View>
            </Modal>
        </SafeAreaContainer>
    );
}

const styles = StyleSheet.create({
    safeRoot: { flex: 1, backgroundColor: '#f5f7fb' },

    // Header - Hello User
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
    headerLeft: { flex: 1 },
    greeting: { fontSize: 24, fontWeight: '700', color: '#111827', letterSpacing: -0.3 },
    subtitle: { marginTop: 4, fontSize: 13, color: '#6b7280', letterSpacing: -0.2 },
    avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    content: { flex: 1 },
    scrollInner: { paddingBottom: 40, paddingTop: 0 },

    // 1. Search Bar
    searchContainer: { paddingHorizontal: 16, marginTop: 12, marginBottom: 8 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 10,
    },
    searchInput: { flex: 1, fontSize: 16, color: '#333' },

    // 2. Ads 1 - Hero Banner
    heroWrapper: { marginHorizontal: 16, marginTop: 8, marginBottom: 12 },

    // 3. Sections
    section: { marginTop: 8, paddingHorizontal: 16 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4
    },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827', letterSpacing: -0.3 },
    seeAllText: { fontSize: 14, fontWeight: '600' },

    // Categories Grid - What are you looking for
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 12,
        paddingHorizontal: 0,
        paddingBottom: 20
    },
    categoryCard: {
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
    categoryIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10
    },
    categoryName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
        letterSpacing: -0.2,
        lineHeight: 16
    },

    // 4. Ads 2 - Video Banner
    videoBannerContainer: { paddingHorizontal: 16, marginBottom: 20 },
    videoCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f0f2f5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    videoThumbnail: {
        backgroundColor: '#f8f9fa',
        paddingVertical: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 12 },
    videoSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },
    watchButton: { paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f2f5' },
    watchButtonText: { fontSize: 14, fontWeight: '600' },

    // 5. Platform Services - Horizontal Scroll
    platformServicesScroll: { paddingRight: 16, gap: 12 },
    platformServiceCard: {
        width: 140,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f0f2f5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        marginRight: 12,
    },
    platformServiceImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 8,
    },
    platformServiceIconPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    platformServiceName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 4,
    },
    platformServicePrice: {
        fontSize: 12,
        fontWeight: '700',
        color: B.accent,
        textAlign: 'center',
    },

    // Empty States
    emptyState: {
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingVertical: 48,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f0f2f5'
    },
    emptyPlatformContainer: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
    },
    emptyTitle: { marginTop: 14, fontSize: 16, fontWeight: '700', color: '#111827' },
    emptySubtitle: { marginTop: 6, fontSize: 13, color: '#6b7280' },

    // Skeletons
    skeletonIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#e5e7eb' },
    skeletonPlatformIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#e5e7eb' },
    skeletonText: { height: 12, borderRadius: 6, backgroundColor: '#e5e7eb' },

    // Modal
    modalContainer: { flex: 1, backgroundColor: '#fff' },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f2f5'
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    webview: { flex: 1 },
});
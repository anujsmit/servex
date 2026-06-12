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
    Animated,
    Dimensions,
    RefreshControl,
    TextInput,
    Image,
} from 'react-native';

import { SafeAreaContainer } from '../../../components/SafeAreaContainer';
import { customerBrand as B, customerDashboardColors as C } from '../../../lib/customerDashboardTokens';
import { useAuth } from '../../../context/AuthContext';
import { useLocation } from '../../../context/LocationContext';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { HeroBanner } from '../../../components/HeroBanner';

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
    isPopular?: boolean;
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
            <Animated.View style={[styles.skeletonText, { opacity, width: 60, marginLeft: 8 }]} />
        </View>
    );
};

const PopularServiceSkeleton = () => {
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
        <View style={styles.popularServiceCard}>
            <Animated.View style={[styles.skeletonPopularImage, { opacity }]} />
            <Animated.View style={[styles.skeletonText, { opacity, width: '70%', marginTop: 12 }]} />
            <Animated.View style={[styles.skeletonText, { opacity, width: '40%', marginTop: 6 }]} />
        </View>
    );
};

export default function CustomerDashboard() {
    const { user } = useAuth();
    const { address, isLoading: locationLoading, refetch: refetchLocation } = useLocation();
    const router = useRouter();
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [popularServices, setPopularServices] = useState<PlatformService[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [popularServicesLoading, setPopularServicesLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCategories, setFilteredCategories] = useState<ServiceCategory[]>([]);
    const scrollViewRef = useRef<ScrollView>(null);

    const brandStyles = useMemo(() => ({
        avatar: { backgroundColor: B.accent },
        seeAll: { color: B.accent },
        searchBorder: { borderColor: '#e5e7eb' },
    }), []);

    useEffect(() => {
        fetchCategories();
        fetchPopularServices();
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
            const url = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/services`;
            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                let categoriesData = [];
                if (Array.isArray(data)) categoriesData = data;
                else if (Array.isArray(data.services)) categoriesData = data.services;
                else if (Array.isArray(data.categories)) categoriesData = data.categories;
                else if (Array.isArray(data.data)) categoriesData = data.data;
                
                const mappedCategories = categoriesData.map(cat => ({
                    id: cat.id,
                    serviceName: cat.serviceName || cat.name,
                    description: cat.description,
                    customIconUrl: cat.customIconUrl || cat.custom_icon_url || null,
                    iconColor: cat.iconColor || cat.icon_color || cat.mapIconColor || '#1890ff',
                    isActive: cat.isActive !== false,
                }));

                const activeCategories = mappedCategories.filter(cat => cat.isActive);
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

    const fetchPopularServices = async () => {
        try {
            setPopularServicesLoading(true);
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/platform-services`);
            const data = await response.json();

            if (response.ok && data.categories) {
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
                                isPopular: service.is_featured || service.isPopular || false,
                            });
                        });
                    }
                });
                const popular = allServices.filter(s => s.isPopular).length > 0 
                    ? allServices.filter(s => s.isPopular).slice(0, 8)
                    : allServices.slice(0, 8);
                setPopularServices(popular);
            } else if (data.services && Array.isArray(data.services)) {
                setPopularServices(data.services.slice(0, 8));
            } else {
                setPopularServices([]);
            }
        } catch (error) {
            console.log('Failed to fetch popular services:', error);
            setPopularServices([]);
        } finally {
            setPopularServicesLoading(false);
        }
    };

    const refreshAllData = async () => {
        setRefreshing(true);
        await Promise.all([fetchCategories(), fetchPopularServices(), refetchLocation()]);
        setRefreshing(false);
    };

    const onRefresh = useCallback(() => { refreshAllData(); }, []);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const getCategoryColor = (category: ServiceCategory, index: number) => {
        if (category.iconColor) return category.iconColor;
        if (category.mapIconColor) return category.mapIconColor;
        const colors = ['#FF6B6B', '#4A90E2', '#4CAF50', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4'];
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

    const openPopularService = (service: PlatformService) => {
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

    const renderSearchBar = () => (
        <View style={styles.searchContainer}>
            <View style={[styles.searchBar, brandStyles.searchBorder]}>
                <Feather name="search" size={18} color="#6b7280" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search for services..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color="#9ca3af" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const renderHeroBanner = () => (
        <View style={styles.heroWrapper}>
            <HeroBanner />
        </View>
    );

    const renderCategories = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>What are you looking for?</Text>
            </View>

            {categoriesLoading && !refreshing ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesHorizontalScroll}>
                    {[1, 2, 3, 4].map((item) => <CategorySkeleton key={item} />)}
                </ScrollView>
            ) : filteredCategories.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="search-off" size={40} color={C.muted || '#9ca3af'} />
                    <Text style={styles.emptyTitle}>No categories found</Text>
                    <Text style={styles.emptySubtitle}>Try searching for something else</Text>
                </View>
            ) : (
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesHorizontalScroll}
                >
                    {filteredCategories.map((category, index) => {
                        const iconColor = getCategoryColor(category, index);
                        return (
                            <TouchableOpacity
                                key={category.id}
                                style={[styles.categoryCard, { borderColor: `${iconColor}25` }]}
                                activeOpacity={0.7}
                                onPress={() => openCategory(category)}
                            >
                                <View style={[styles.categoryIconContainer, { backgroundColor: `${iconColor}12` }]}>
                                    {category.customIconUrl ? (
                                        <Image
                                            source={{ uri: category.customIconUrl }}
                                            style={{ width: 22, height: 22 }}
                                            resizeMode="contain"
                                        />
                                    ) : (
                                        <Text style={{ fontSize: 14, fontWeight: '700', color: iconColor }}>
                                            {category.serviceName?.charAt(0).toUpperCase()}
                                        </Text>
                                    )}
                                </View>
                                <Text style={styles.categoryName} numberOfLines={1}>
                                    {category.serviceName}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );

    const renderPopularServices = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>⭐ Popular Services</Text>
                <TouchableOpacity onPress={() => router.push('/platform-services')}>
                    <Text style={[styles.seeAllText, brandStyles.seeAll]}>View All</Text>
                </TouchableOpacity>
            </View>

            {popularServicesLoading && !refreshing ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularScrollContent}>
                    {[1, 2, 3].map((item) => <PopularServiceSkeleton key={item} />)}
                </ScrollView>
            ) : popularServices.length === 0 ? (
                <View style={styles.emptyPopularContainer}>
                    <MaterialIcons name="info-outline" size={28} color={C.muted || '#9ca3af'} />
                    <Text style={styles.emptySubtitle}>No popular services available</Text>
                </View>
            ) : (
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.popularScrollContent}
                >
                    {popularServices.map((service) => (
                        <TouchableOpacity
                            key={service.id}
                            style={styles.popularServiceCard}
                            activeOpacity={0.7}
                            onPress={() => openPopularService(service)}
                        >
                            {service.imageUrl ? (
                                <Image source={{ uri: service.imageUrl }} style={styles.popularServiceImage} />
                            ) : (
                                <View style={[styles.popularServiceIconPlaceholder, { backgroundColor: `${B.accent}10` }]}>
                                    <MaterialIcons name="trending-up" size={24} color={B.accent} />
                                </View>
                            )}
                            <View style={styles.popularInfoContainer}>
                                <Text style={styles.popularServiceName} numberOfLines={1}>
                                    {service.name}
                                </Text>
                                <Text style={[styles.popularServicePrice, { color: B.accent }]}>
                                    रु {parseFloat(service.price).toLocaleString()}
                                </Text>
                            </View>
                            <View style={[styles.popularBookButton, { backgroundColor: B.accent }]}>
                                <Text style={styles.popularBookText}>Book Now</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );

    return (
        <SafeAreaContainer style={styles.safeRoot} showBottomNav>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.greeting}>Hello, {user?.fullName?.split(' ')[0] || 'Customer'} 👋</Text>
                    <View style={styles.locationContainer}>
                        <Ionicons name="location-sharp" size={14} color={B.accent} />
                        <Text style={styles.subtitle} numberOfLines={1}>
                            {locationLoading ? 'Detecting location...' : address || 'Welcome back'}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.avatar, brandStyles.avatar]}
                    onPress={() => router.push('/(protected)/(customer)/settings')}
                    activeOpacity={0.8}
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
                    />
                }
            >
                {renderSearchBar()}
                {renderHeroBanner()}
                {renderCategories()}
                {renderPopularServices()}
            </ScrollView>
        </SafeAreaContainer>
    );
}

const styles = StyleSheet.create({
    safeRoot: { flex: 1, backgroundColor: '#f9fafb' },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerLeft: { flex: 1, paddingRight: 16 },
    greeting: { fontSize: 22, fontWeight: '700', color: '#111827', letterSpacing: -0.5 },
    locationContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
    subtitle: { fontSize: 13, color: '#4b5563', fontWeight: '500', flex: 1 },
    avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    content: { flex: 1 },
    scrollInner: { paddingBottom: 32 },

    searchContainer: { paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
        gap: 10,
    },
    searchInput: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },

    heroWrapper: { marginHorizontal: 16, marginTop: 12, marginBottom: 12 },

    section: { marginTop: 16 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        paddingHorizontal: 20
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', letterSpacing: -0.3 },
    seeAllText: { fontSize: 14, fontWeight: '600' },

    /* Beautiful Pill/Chip Category Styles */
    categoriesHorizontalScroll: { paddingLeft: 20, paddingRight: 8, paddingBottom: 6, gap: 10 },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 100,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    categoryIconContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8
    },
    categoryName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        letterSpacing: -0.1
    },

    /* Popular Services Horizontal Carousel Styles */
    popularScrollContent: { paddingLeft: 20, paddingRight: 8, paddingBottom: 12, gap: 14 },
    popularServiceCard: {
        width: 160,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f3f4f6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },
    popularServiceImage: { width: 80, height: 80, borderRadius: 22, marginBottom: 10 },
    popularServiceIconPlaceholder: { width: 80, height: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    popularInfoContainer: { width: '100%', alignItems: 'center', marginBottom: 10 },
    popularServiceName: { fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: 4 },
    popularServicePrice: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
    popularBookButton: { width: '100%', paddingVertical: 8, borderRadius: 14, alignItems: 'center' },
    popularBookText: { fontSize: 12, fontWeight: '700', color: '#fff' },

    emptyState: { backgroundColor: '#fff', borderRadius: 24, paddingVertical: 40, marginHorizontal: 20, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
    emptyPopularContainer: { padding: 24, alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 16, marginHorizontal: 20 },
    emptyTitle: { marginTop: 10, fontSize: 15, fontWeight: '700', color: '#111827' },
    emptySubtitle: { marginTop: 4, fontSize: 13, color: '#6b7280' },

    skeletonIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#e5e7eb' },
    skeletonPopularImage: { width: 80, height: 80, borderRadius: 22, backgroundColor: '#e5e7eb' },
    skeletonText: { height: 12, borderRadius: 6, backgroundColor: '#e5e7eb' },
});
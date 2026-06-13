// app/(protected)/(customer)/category/[id].tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    TextInput,
    RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface PlatformService {
    id: string;
    name: string;
    description: string | null;
    price: string;
    imageUrl: string | null;
    duration_minutes: number | null;
    isActive: boolean;
}

interface CategoryInfo {
    id: number;
    name: string;
    description: string | null;
    iconUrl: string | null;
    iconColor: string;
}

export default function CategoryServicesScreen() {
    const { id, name, serviceId } = useLocalSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const navigation = useNavigation();
    
    const [services, setServices] = useState<PlatformService[]>([]);
    const [categoryInfo, setCategoryInfo] = useState<CategoryInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredServices, setFilteredServices] = useState<PlatformService[]>([]);

    useEffect(() => {
        // Set navigation title
        navigation.setOptions({
            title: name as string || 'Services',
            headerTitleStyle: { fontWeight: '600', fontSize: 18 },
            headerShadowVisible: false,
            headerStyle: { backgroundColor: '#ffffff' },
        });
    }, [name]);

    useEffect(() => {
        fetchCategoryServices();
    }, [id, serviceId]);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = services.filter(service =>
                service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            setFilteredServices(filtered);
        } else {
            setFilteredServices(services);
        }
    }, [searchQuery, services]);

    const fetchCategoryServices = async () => {
        setLoading(true);
        try {
            // Use the correct API endpoint
            const url = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/platform-services/category/${serviceId || id}`;
            const response = await fetch(url);
            const data = await response.json();

            if (response.ok && data.success) {
                setCategoryInfo(data.category);
                setServices(data.services || []);
                setFilteredServices(data.services || []);
            } else {
                console.log('Failed to fetch services:', data.message);
                setServices([]);
            }
        } catch (error) {
            console.error('Error fetching category services:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchCategoryServices();
        setRefreshing(false);
    };

    const handleServicePress = (service: PlatformService) => {
        router.push({
            pathname: '/service-details/[id]',
            params: {
                id: service.id,
                name: service.name,
                price: service.price,
                description: service.description || '',
                imageUrl: service.imageUrl || '',
                categoryName: categoryInfo?.name,
            },
        });
    };

    const getCategoryColor = () => {
        return categoryInfo?.iconColor || '#e67e22';
    };

    const renderServiceCard = (service: PlatformService) => {
        const categoryColor = getCategoryColor();
        
        return (
            <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                activeOpacity={0.7}
                onPress={() => handleServicePress(service)}
            >
                {/* Service Image */}
                <View style={styles.serviceImageContainer}>
                    {service.imageUrl ? (
                        <Image 
                            source={{ uri: service.imageUrl }} 
                            style={styles.serviceImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <LinearGradient
                            colors={[categoryColor + '20', categoryColor + '08']}
                            style={styles.serviceImagePlaceholder}
                        >
                            <MaterialIcons name="build" size={40} color={categoryColor} />
                        </LinearGradient>
                    )}
                </View>

                {/* Service Info */}
                <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName} numberOfLines={1}>
                        {service.name}
                    </Text>
                    <Text style={styles.serviceDescription} numberOfLines={2}>
                        {service.description || 'Professional service at your doorstep'}
                    </Text>
                    <View style={styles.serviceFooter}>
                        <View>
                            <Text style={styles.priceLabel}>Starting from</Text>
                            <Text style={styles.servicePrice}>
                                रु {parseFloat(service.price).toLocaleString()}
                            </Text>
                        </View>
                        {service.duration_minutes && (
                            <View style={styles.durationBadge}>
                                <Ionicons name="time-outline" size={14} color="#64748b" />
                                <Text style={styles.durationText}>
                                    {service.duration_minutes} mins
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Book Button */}
                <View style={[styles.bookButton, { backgroundColor: categoryColor }]}>
                    <Text style={styles.bookButtonText}>Book</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                </View>
            </TouchableOpacity>
        );
    };

    const renderCategoryHeader = () => {
        const categoryColor = getCategoryColor();
        
        return (
            <LinearGradient
                colors={[categoryColor + '08', '#ffffff']}
                style={styles.headerContainer}
            >
                <View style={styles.categoryIconWrapper}>
                    {categoryInfo?.iconUrl ? (
                        <Image 
                            source={{ uri: categoryInfo.iconUrl }} 
                            style={styles.categoryIcon}
                            resizeMode="contain"
                        />
                    ) : (
                        <MaterialIcons name="build" size={48} color={categoryColor} />
                    )}
                </View>
                <Text style={styles.categoryName}>{categoryInfo?.name || name}</Text>
                {categoryInfo?.description && (
                    <Text style={styles.categoryDescription}>{categoryInfo.description}</Text>
                )}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <MaterialIcons name="handyman" size={18} color={categoryColor} />
                        <Text style={styles.statText}>
                            {services.length} {services.length === 1 ? 'Service' : 'Services'}
                        </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <MaterialIcons name="star" size={18} color="#fbbf24" />
                        <Text style={styles.statText}>Trusted Professionals</Text>
                    </View>
                </View>
            </LinearGradient>
        );
    };

    const renderSearchBar = () => (
        <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
                <Feather name="search" size={18} color="#94a3b8" />
                <TextInput
                    style={styles.searchInput}
                    placeholder={`Search ${categoryInfo?.name || name} services...`}
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#e67e22" />
                <Text style={styles.loadingText}>Loading services...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e67e22']} />
            }
        >
            {renderCategoryHeader()}
            {renderSearchBar()}

            <View style={styles.servicesSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        Available {categoryInfo?.name || name} Services
                    </Text>
                    <Text style={styles.serviceCount}>{filteredServices.length} services</Text>
                </View>

                {filteredServices.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="search-off" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyTitle}>No services found</Text>
                        <Text style={styles.emptySubtitle}>
                            {searchQuery ? 'Try a different search term' : 'No services available in this category yet'}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.servicesList}>
                        {filteredServices.map(renderServiceCard)}
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748b',
    },
    
    // Header Styles
    headerContainer: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    categoryIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    categoryIcon: {
        width: 48,
        height: 48,
    },
    categoryName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    categoryDescription: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
        marginBottom: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 16,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 12,
    },
    
    // Search Bar
    searchContainer: {
        paddingHorizontal: 20,
        marginTop: 16,
        marginBottom: 8,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: '#e8edf2',
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1e293b',
        paddingVertical: 0,
    },
    
    // Services Section
    servicesSection: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0f172a',
    },
    serviceCount: {
        fontSize: 12,
        color: '#94a3b8',
    },
    servicesList: {
        gap: 16,
    },
    
    // Service Card
    serviceCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#f0f2f5',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        gap: 14,
    },
    serviceImageContainer: {
        width: 80,
        height: 80,
        borderRadius: 16,
        overflow: 'hidden',
    },
    serviceImage: {
        width: '100%',
        height: '100%',
    },
    serviceImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    serviceInfo: {
        flex: 1,
        gap: 6,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        letterSpacing: -0.3,
    },
    serviceDescription: {
        fontSize: 12,
        color: '#64748b',
        lineHeight: 16,
    },
    serviceFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 4,
    },
    priceLabel: {
        fontSize: 10,
        color: '#94a3b8',
    },
    servicePrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#e67e22',
    },
    durationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    durationText: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '500',
    },
    bookButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        alignSelf: 'center',
    },
    bookButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
    },
    
    // Empty State
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        marginTop: 16,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 4,
    },
});
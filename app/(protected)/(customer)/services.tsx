import React, {
    useEffect,
    useState,
    useCallback,
} from 'react';

import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
} from 'react-native';

import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaContainer } from '../../../components/SafeAreaContainer';
import { customerBrand as B } from '../../../lib/customerDashboardTokens';

interface ServiceItem {
    id: string;
    name: string;
    description: string | null;
    price: number | string;
    imageUrl: string | null;
}

interface CategoryGroup {
    categoryId: number;
    categoryName: string;
    services: ServiceItem[];
}

export default function ServicesScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [categories, setCategories] = useState<CategoryGroup[]>([]);

    const fetchAllMarketplaceServices = async () => {
        try {
            const url = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/platform-services`;
            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                let formattedGroups: CategoryGroup[] = [];

                if (data && Array.isArray(data.categories)) {
                    formattedGroups = data.categories;
                } else if (Array.isArray(data)) {
                    formattedGroups = data;
                } else if (data && Array.isArray(data.data)) {
                    formattedGroups = data.data;
                }

                setCategories(formattedGroups);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.log('Error catching system services framework:', error);
            setCategories([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAllMarketplaceServices();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAllMarketplaceServices();
    }, []);

    const handleServiceNavigation = (item: ServiceItem) => {
        router.push({
            pathname: '/service-details/[id]',
            params: {
                id: item.id,
                name: item.name,
                price: item.price.toString(),
                description: item.description || '',
                imageUrl: item.imageUrl || ''
            },
        });
    };

    const renderService = ({ item }: { item: ServiceItem }) => {
        const parsedPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                style={styles.card}
                onPress={() => handleServiceNavigation(item)}
            >
                {item.imageUrl ? (
                    <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.image}
                    />
                ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: `${B.accent}08` }]}>
                        <MaterialIcons name="build" size={32} color={B.accent} />
                    </View>
                )}

                <View style={styles.cardBody}>
                    <Text style={styles.serviceName} numberOfLines={1}>
                        {item.name}
                    </Text>

                    <Text
                        numberOfLines={2}
                        style={styles.description}
                    >
                        {item.description || 'Verified workspace configuration option.'}
                    </Text>

                    <View style={styles.footer}>
                        <Text style={[styles.price, { color: B.accent }]}>
                            रु {parsedPrice ? parsedPrice.toLocaleString() : 0}
                        </Text>

                        <View style={[styles.button, { backgroundColor: B.accent }]}>
                            <MaterialIcons
                                name="arrow-forward"
                                size={16}
                                color="#fff"
                            />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator
                    size="large"
                    color={B.accent}
                />
            </View>
        );
    }

    return (
        <SafeAreaContainer style={styles.safeContainer} showBottomNav={true}>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollInner}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[B.accent]}
                        tintColor={B.accent}
                    />
                }
            >
                <Text style={styles.headerTitle}>Explore Services</Text>

                {categories.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="grid-off" size={48} color="#9ca3af" />
                        <Text style={styles.emptyText}>No service listings found</Text>
                    </View>
                ) : (
                    categories.map((category) => {
                        if (!category.services || category.services.length === 0) return null;

                        return (
                            <View
                                key={category.categoryId}
                                style={styles.section}
                            >
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.categoryTitle}>
                                        {category.categoryName}
                                    </Text>

                                    <Text style={styles.count}>
                                        {category.services.length} {category.services.length === 1 ? 'service' : 'services'}
                                    </Text>
                                </View>

                                <FlatList
                                    horizontal
                                    data={category.services}
                                    renderItem={renderService}
                                    keyExtractor={(item) => item.id.toString()}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.horizontalScrollPadding}
                                />
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaContainer>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    container: {
        flex: 1,
    },
    scrollInner: {
        paddingBottom: 110, // Creates breathing room above the floating Custom Bottom Menu
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: '#111827',
        marginTop: 20,
        marginBottom: 20,
        paddingHorizontal: 20,
        letterSpacing: -0.5,
    },
    section: {
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.2,
    },
    count: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    horizontalScrollPadding: {
        paddingLeft: 20,
        paddingRight: 4,
    },
    card: {
        width: 230,
        backgroundColor: '#fff',
        borderRadius: 20,
        marginRight: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f3f4f6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 4,
    },
    image: {
        width: '100%',
        height: 130,
        backgroundColor: '#f3f4f6',
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        width: '100%',
        height: 130,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBody: {
        padding: 14,
    },
    serviceName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    description: {
        marginTop: 4,
        fontSize: 12,
        color: '#6b7280',
        lineHeight: 16,
        height: 32,
    },
    footer: {
        marginTop: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    button: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
});
import React, {
    useEffect,
    useState,
} from 'react';

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Image,
} from 'react-native';

import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import { MaterialIcons } from '@expo/vector-icons';

import { SafeAreaContainer } from '../../../../components/SafeAreaContainer';

interface PlatformService {
    id: number;

    name: string;

    description?: string;

    price?: number;

    image_url?: string;
}

export default function ServiceDetailsPage() {
    const router = useRouter();

    const { id, serviceName } =
        useLocalSearchParams();

    const [services, setServices] =
        useState<PlatformService[]>([]);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        fetchPlatformServices();
    }, []);

    const fetchPlatformServices =
        async () => {
            try {
                setLoading(true);

                const response =
                    await fetch(
                        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/platform-services/${id}`
                    );

                const data =
                    await response.json();

                console.log(
                    'PLATFORM SERVICES:',
                    data
                );

                if (response.ok) {
                    // API returns array directly
                    if (
                        Array.isArray(data)
                    ) {
                        setServices(data);
                    }

                    // API returns { services: [] }
                    else if (
                        data &&
                        Array.isArray(
                            data.services
                        )
                    ) {
                        setServices(
                            data.services
                        );
                    }

                    // API returns { data: [] }
                    else if (
                        data &&
                        Array.isArray(
                            data.data
                        )
                    ) {
                        setServices(
                            data.data
                        );
                    }

                    else {
                        setServices([]);
                    }
                }
            } catch (error) {
                console.log(
                    'Failed to fetch platform services:',
                    error
                );

                setServices([]);
            } finally {
                setLoading(false);
            }
        };

    const handleOpenService = (
        item: PlatformService
    ) => {
        router.push({
            pathname:
                '/(protected)/(customer)/service-request/service-details',

            params: {
                platformServiceId:
                    item.id.toString(),

                serviceName:
                    item.name,

                description:
                    item.description || '',

                price:
                    item.price?.toString() ||
                    '0',

                image:
                    item.image_url || '',

                parentServiceId:
                    id?.toString(),
            },
        });
    };

    return (
        <SafeAreaContainer
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={
                    styles.content
                }
                showsVerticalScrollIndicator={
                    false
                }
            >
                {/* HEADER */}

                <View style={styles.header}>
                    <Text style={styles.title}>
                        {serviceName}
                    </Text>

                    <Text
                        style={styles.subtitle}
                    >
                        Choose the service you
                        need
                    </Text>
                </View>

                {/* LOADING */}

                {loading ? (
                    <View
                        style={
                            styles.loaderContainer
                        }
                    >
                        <ActivityIndicator
                            size="large"
                            color="#2563eb"
                        />
                    </View>
                ) : services.length ===
                  0 ? (
                    <View
                        style={
                            styles.emptyContainer
                        }
                    >
                        <MaterialIcons
                            name="home-repair-service"
                            size={70}
                            color="#9ca3af"
                        />

                        <Text
                            style={
                                styles.emptyTitle
                            }
                        >
                            No services available
                        </Text>

                        <Text
                            style={
                                styles.emptySubtitle
                            }
                        >
                            Services will appear
                            here once added from
                            admin panel
                        </Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {services.map(
                            (item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={
                                        styles.card
                                    }
                                    activeOpacity={
                                        0.88
                                    }
                                    onPress={() =>
                                        handleOpenService(
                                            item
                                        )
                                    }
                                >
                                    {/* IMAGE */}

                                    {item.image_url ? (
                                        <Image
                                            source={{
                                                uri: item.image_url,
                                            }}
                                            style={
                                                styles.image
                                            }
                                        />
                                    ) : (
                                        <View
                                            style={
                                                styles.imagePlaceholder
                                            }
                                        >
                                            <MaterialIcons
                                                name="build"
                                                size={
                                                    46
                                                }
                                                color="#2563eb"
                                            />
                                        </View>
                                    )}

                                    {/* CONTENT */}

                                    <View
                                        style={
                                            styles.cardContent
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.cardTitle
                                            }
                                        >
                                            {
                                                item.name
                                            }
                                        </Text>

                                        <Text
                                            style={
                                                styles.cardDescription
                                            }
                                            numberOfLines={
                                                2
                                            }
                                        >
                                            {item.description ||
                                                'Professional verified service'}
                                        </Text>

                                        <View
                                            style={
                                                styles.bottomRow
                                            }
                                        >
                                            <View>
                                                <Text
                                                    style={
                                                        styles.price
                                                    }
                                                >
                                                    Rs.{' '}
                                                    {item.price ||
                                                        0}
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.duration
                                                    }
                                                >
                                                    45
                                                    mins
                                                </Text>
                                            </View>

                                            <TouchableOpacity
                                                style={
                                                    styles.bookButton
                                                }
                                                onPress={() =>
                                                    handleOpenService(
                                                        item
                                                    )
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.bookButtonText
                                                    }
                                                >
                                                    View
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fb',
    },

    content: {
        padding: 16,
        paddingBottom: 40,
    },

    header: {
        marginBottom: 20,
    },

    title: {
        fontSize: 30,
        fontWeight: '700',
        color: '#111827',
    },

    subtitle: {
        marginTop: 6,
        fontSize: 14,
        color: '#6b7280',
    },

    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
    },

    emptyContainer: {
        alignItems: 'center',
        paddingTop: 80,
    },

    emptyTitle: {
        marginTop: 16,
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },

    emptySubtitle: {
        marginTop: 8,
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 30,
    },

    grid: {
        gap: 18,
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eef2f7',
    },

    image: {
        width: '100%',
        height: 190,
    },

    imagePlaceholder: {
        width: '100%',
        height: 190,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
    },

    cardContent: {
        padding: 18,
    },

    cardTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: '#111827',
    },

    cardDescription: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 22,
        color: '#6b7280',
    },

    bottomRow: {
        marginTop: 18,
        flexDirection: 'row',
        justifyContent:
            'space-between',
        alignItems: 'center',
    },

    price: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
    },

    duration: {
        marginTop: 2,
        fontSize: 13,
        color: '#6b7280',
    },

    bookButton: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderRadius: 12,
    },

    bookButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});
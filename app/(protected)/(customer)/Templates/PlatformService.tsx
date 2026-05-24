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

import { useLocalSearchParams } from 'expo-router';

import { useRouter } from 'expo-router';

import { MaterialIcons } from '@expo/vector-icons';

import { SafeAreaContainer } from '../../../../components/SafeAreaContainer';

interface PlatformService {
    id: string;
    name: string;
    description?: string;
    price?: number;
    image_url?: string;
}

export default function ServiceDetailsPage() {
    const { id, serviceName } =
        useLocalSearchParams();

    const router = useRouter();

    const [services, setServices] = useState<
        PlatformService[]
    >([]);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        fetchPlatformServices();
    }, []);

    const fetchPlatformServices = async () => {
        try {
            setLoading(true);

            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/platform-services/${id}`
            );

            const data = await response.json();

            console.log(
                'PLATFORM SERVICES:',
                data
            );

            if (response.ok) {
                if (Array.isArray(data)) {
                    setServices(data);
                } else if (
                    Array.isArray(data.services)
                ) {
                    setServices(data.services);
                } else if (
                    Array.isArray(data.data)
                ) {
                    setServices(data.data);
                } else {
                    setServices([]);
                }
            }
        } catch (error) {
            console.log(
                'Failed to fetch platform services:',
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const handleBookService = (
        item: PlatformService
    ) => {
        router.push({
            pathname:'/service-request/book-service',

            params: {
                serviceId: item.id,
                serviceName: item.name,
                parentServiceId: id,
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
                <View style={styles.header}>
                    <Text style={styles.title}>
                        {serviceName}
                    </Text>

                    <Text
                        style={styles.subtitle}
                    >
                        Choose the service you need
                    </Text>
                </View>

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
                                        0.8
                                    }
                                    onPress={() =>
                                        handleBookService(
                                            item
                                        )
                                    }
                                >
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
                                                    40
                                                }
                                                color="#2563eb"
                                            />
                                        </View>
                                    )}

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
                                                'Professional service by verified experts'}
                                        </Text>

                                        <View
                                            style={
                                                styles.bottomRow
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.price
                                                }
                                            >
                                                Rs.{' '}
                                                {item.price ||
                                                    0}
                                            </Text>

                                            <TouchableOpacity
                                                style={
                                                    styles.bookButton
                                                }
                                                onPress={() =>
                                                    handleBookService(
                                                        item
                                                    )
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.bookButtonText
                                                    }
                                                >
                                                    Book
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
        paddingBottom: 30,
    },

    header: {
        marginBottom: 20,
    },

    title: {
        fontSize: 28,
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

    grid: {
        gap: 16,
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },

    image: {
        width: '100%',
        height: 180,
    },

    imagePlaceholder: {
        width: '100%',
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
    },

    cardContent: {
        padding: 16,
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },

    cardDescription: {
        marginTop: 8,
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
    },

    bottomRow: {
        marginTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    price: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },

    bookButton: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
    },

    bookButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});
import React, {
    useMemo,
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
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

interface Service {
    id: number;
    service_name: string;
    description?: string;
}

export default function CustomerDashboard() {
    const { user } = useAuth();

    const {
        address,
        isLoading: locationLoading,
    } = useLocation();

    const router = useRouter();

    const [services, setServices] = useState<
        Service[]
    >([]);

    const [servicesLoading, setServicesLoading] =
        useState(true);

    const brandStyles = useMemo(
        () => ({
            avatar: {
                backgroundColor: B.accent,
                boxShadow: `0 6px 18px rgba(${B.accentRgb}, 0.28), 0 2px 6px rgba(15, 23, 42, 0.06)`,
            },

            accentSoftFill: {
                backgroundColor: B.accentSoft,
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
    } = useCustomerRequestsQuery();

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setServicesLoading(true);

            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/services`
            );

            const data = await response.json();

            console.log('SERVICES:', data);

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
                'Failed to fetch services:',
                error
            );

            setServices([]);
        } finally {
            setServicesLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const getServiceIcon = (
        serviceName: string
    ) => {
        const name =
            serviceName?.toLowerCase() || '';

        if (name.includes('electric')) {
            return 'electrical-services';
        }

        if (name.includes('plumb')) {
            return 'plumbing';
        }

        if (name.includes('paint')) {
            return 'format-paint';
        }

        if (name.includes('clean')) {
            return 'cleaning-services';
        }

        if (name.includes('carpent')) {
            return 'handyman';
        }

        if (name.includes('ac')) {
            return 'ac-unit';
        }

        return 'build';
    };

    const getStatusStyle = useCallback(
        (status: string) => {
            switch (status) {
                case 'pending':
                    return {
                        backgroundColor: '#fef3c7',
                        color: '#d97706',
                    };

                case 'assigned':
                    return {
                        backgroundColor: '#dbeafe',
                        color: B.accent,
                    };

                case 'completed':
                    return {
                        backgroundColor: '#d1fae5',
                        color: '#059669',
                    };

                case 'canceled':
                    return {
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                    };

                default:
                    return {
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                    };
            }
        },
        []
    );

    const openServiceCategory = (
        service: Service
    ) => {
        router.push({
            pathname: '/services/[id]',

            params: {
                id: service.id.toString(),

                serviceName:
                    service.serviceName,
            },
        });
    };

    return (
        <SafeAreaContainer style={styles.safeRoot}>
            {/* HEADER */}

            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.greeting}>
                        Hello,{' '}
                        {user?.fullName ||
                            'Customer'}
                    </Text>

                    <Text
                        style={styles.subtitle}
                        numberOfLines={1}
                    >
                        {locationLoading
                            ? 'Detecting location...'
                            : address}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.avatar,
                        brandStyles.avatar,
                    ]}
                    onPress={() =>
                        router.push(
                            '/(protected)/(customer)/settings'
                        )
                    }
                    activeOpacity={0.7}
                >
                    <Text style={styles.avatarText}>
                        {user?.fullName
                            ? getInitials(
                                  user.fullName
                              )
                            : 'U'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={
                    styles.scrollInner
                }
                showsVerticalScrollIndicator={
                    false
                }
            >
                {/* HERO */}

                <HeroBanner />

                {/* SERVICES */}

                <View style={styles.section}>
                    <View
                        style={
                            styles.sectionHeader
                        }
                    >
                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            What are you looking
                            for?
                        </Text>
                    </View>

                    {servicesLoading ? (
                        <View
                            style={
                                styles.loadingContainer
                            }
                        >
                            <ActivityIndicator
                                size="large"
                                color={B.accent}
                            />
                        </View>
                    ) : (
                        <View
                            style={
                                styles.servicesGrid
                            }
                        >
                            {services.map(
                                (
                                    service
                                ) => (
                                    <TouchableOpacity
                                        key={
                                            service.id
                                        }
                                        style={
                                            styles.serviceCard
                                        }
                                        activeOpacity={
                                            0.85
                                        }
                                        onPress={() =>
                                            openServiceCategory(
                                                service
                                            )
                                        }
                                    >
                                        <View
                                            style={[
                                                styles.serviceIconContainer,
                                                brandStyles.accentSoftFill,
                                            ]}
                                        >
                                            <MaterialIcons
                                                name={
                                                    getServiceIcon(
                                                        service.serviceName
                                                    ) as any
                                                }
                                                size={
                                                    34
                                                }
                                                color={
                                                    B.accent
                                                }
                                            />
                                        </View>

                                        <Text
                                            style={
                                                styles.serviceName
                                            }
                                            numberOfLines={
                                                2
                                            }
                                        >
                                            {
                                                service.serviceName
                                            }
                                        </Text>
                                    </TouchableOpacity>
                                )
                            )}
                        </View>
                    )}
                </View>

                {/* RECENT ACTIVITIES */}

                <View
                    style={[
                        styles.section,
                        styles.bottomSpacing,
                    ]}
                >
                    <View
                        style={
                            styles.sectionHeader
                        }
                    >
                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Recent Activities
                        </Text>

                        {requests.length >
                        0 ? (
                            <TouchableOpacity
                                onPress={() =>
                                    router.push(
                                        '/(protected)/(customer)/requests'
                                    )
                                }
                            >
                                <Text
                                    style={[
                                        styles.seeAllText,
                                        brandStyles.seeAll,
                                    ]}
                                >
                                    View all
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {requestsLoading ? (
                        <View
                            style={
                                styles.loadingContainer
                            }
                        >
                            <ActivityIndicator
                                size="small"
                                color={B.accent}
                            />
                        </View>
                    ) : requests.length ===
                      0 ? (
                        <View
                            style={
                                styles.emptyState
                            }
                        >
                            <MaterialIcons
                                name="event-note"
                                size={42}
                                color={
                                    C.muted
                                }
                            />

                            <Text
                                style={
                                    styles.emptyTitle
                                }
                            >
                                No bookings yet
                            </Text>

                            <Text
                                style={
                                    styles.emptySubtitle
                                }
                            >
                                Book your first
                                service now
                            </Text>
                        </View>
                    ) : (
                        <View
                            style={
                                styles.requestsContainer
                            }
                        >
                            {requests
                                .slice(0, 3)
                                .map(
                                    (
                                        request: any
                                    ) => {
                                        const statusStyle =
                                            getStatusStyle(
                                                request.status
                                            );

                                        return (
                                            <TouchableOpacity
                                                key={
                                                    request.id
                                                }
                                                style={
                                                    styles.requestCard
                                                }
                                            >
                                                <View
                                                    style={
                                                        styles.requestHeader
                                                    }
                                                >
                                                    <View
                                                        style={[
                                                            styles.requestIcon,
                                                            brandStyles.accentSoftFill,
                                                        ]}
                                                    >
                                                        <MaterialIcons
                                                            name={
                                                                getServiceIcon(
                                                                    request.type
                                                                ) as any
                                                            }
                                                            size={
                                                                24
                                                            }
                                                            color={
                                                                B.accent
                                                            }
                                                        />
                                                    </View>

                                                    <View
                                                        style={
                                                            styles.requestInfo
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.requestType
                                                            }
                                                        >
                                                            {
                                                                request.type
                                                            }
                                                        </Text>

                                                        <Text
                                                            style={
                                                                styles.requestAddress
                                                            }
                                                            numberOfLines={
                                                                1
                                                            }
                                                        >
                                                            {
                                                                request.address
                                                            }
                                                        </Text>
                                                    </View>

                                                    <View
                                                        style={[
                                                            styles.statusBadge,
                                                            {
                                                                backgroundColor:
                                                                    statusStyle.backgroundColor,
                                                            },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.statusText,
                                                                {
                                                                    color:
                                                                        statusStyle.color,
                                                                },
                                                            ]}
                                                        >
                                                            {
                                                                request.status
                                                            }
                                                        </Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    }
                                )}
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
        justifyContent:
            'space-between',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },

    headerLeft: {
        flex: 1,
    },

    greeting: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },

    subtitle: {
        marginTop: 4,
        fontSize: 13,
        color: '#6b7280',
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
        padding: 16,
        paddingBottom: 40,
    },

    section: {
        marginTop: 22,
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent:
            'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },

    seeAllText: {
        fontSize: 13,
        fontWeight: '600',
    },

    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },

    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent:
            'space-between',
    },

    serviceCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 22,
        paddingVertical: 24,
        paddingHorizontal: 16,
        marginBottom: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eef2f7',
    },

    serviceIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },

    serviceName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
    },

    requestsContainer: {
        gap: 12,
    },

    requestCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#eef2f7',
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
        marginRight: 12,
    },

    requestInfo: {
        flex: 1,
    },

    requestType: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },

    requestAddress: {
        marginTop: 4,
        fontSize: 12,
        color: '#6b7280',
    },

    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },

    statusText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'capitalize',
    },

    emptyState: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 40,
        alignItems: 'center',
    },

    emptyTitle: {
        marginTop: 12,
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
        marginBottom: 20,
    },
});
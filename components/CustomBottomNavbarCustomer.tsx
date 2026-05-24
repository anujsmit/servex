import React from 'react';

import {
    View,
    TouchableOpacity,
    StyleSheet,
    Text,
} from 'react-native';

import {
    usePathname,
    useRouter,
} from 'expo-router';

import {
    Ionicons,
    MaterialIcons,
} from '@expo/vector-icons';

export default function CustomBottomNavbarCustomer() {
    const router = useRouter();

    const pathname = usePathname();

    const tabs = [
        {
            label: 'Home',

            icon: 'home-outline',

            activeIcon: 'home',

            path:
                '/(protected)/(customer)',
        },

        {
            label: 'Requests',

            icon: 'receipt-long',

            activeIcon: 'receipt-long',

            path:
                '/(protected)/(customer)/requests',
        },

        {
            label: 'Settings',

            icon: 'person-outline',

            activeIcon: 'person',

            path:
                '/(protected)/(customer)/settings',
        },
    ];

    return (
        <View style={styles.wrapper}>
            <View style={styles.container}>
                {tabs.map((tab) => {
                    const isActive =
                        pathname === tab.path;

                    return (
                        <TouchableOpacity
                            key={tab.label}
                            style={
                                styles.tabButton
                            }
                            activeOpacity={
                                0.8
                            }
                            onPress={() =>
                                router.push(
                                    tab.path as any
                                )
                            }
                        >
                            <View
                                style={[
                                    styles.iconContainer,

                                    isActive &&
                                        styles.activeIconContainer,
                                ]}
                            >
                                {tab.label ===
                                'Requests' ? (
                                    <MaterialIcons
                                        name={
                                            isActive
                                                ? 'receipt-long'
                                                : 'receipt-long'
                                        }
                                        size={
                                            24
                                        }
                                        color={
                                            isActive
                                                ? '#2563eb'
                                                : '#6b7280'
                                        }
                                    />
                                ) : (
                                    <Ionicons
                                        name={
                                            (
                                                isActive
                                                    ? tab.activeIcon
                                                    : tab.icon
                                            ) as any
                                        }
                                        size={
                                            24
                                        }
                                        color={
                                            isActive
                                                ? '#2563eb'
                                                : '#6b7280'
                                        }
                                    />
                                )}
                            </View>

                            <Text
                                style={[
                                    styles.label,

                                    isActive &&
                                        styles.activeLabel,
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',

        left: 0,

        right: 0,

        bottom: 18,

        alignItems: 'center',
    },

    container: {
        flexDirection: 'row',

        width: '90%',

        backgroundColor:
            'rgba(255,255,255,0.96)',

        borderRadius: 30,

        height: 74,

        justifyContent:
            'space-around',

        alignItems: 'center',

        shadowColor: '#000',

        shadowOffset: {
            width: 0,
            height: 10,
        },

        shadowOpacity: 0.08,

        shadowRadius: 20,

        elevation: 12,
    },

    tabButton: {
        alignItems: 'center',

        justifyContent: 'center',
    },

    iconContainer: {
        width: 46,

        height: 46,

        borderRadius: 16,

        justifyContent: 'center',

        alignItems: 'center',
    },

    activeIconContainer: {
        backgroundColor: '#eff6ff',
    },

    label: {
        marginTop: 4,

        fontSize: 11,

        fontWeight: '600',

        color: '#6b7280',
    },

    activeLabel: {
        color: '#2563eb',
    },
});
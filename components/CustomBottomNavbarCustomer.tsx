import React from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Text,
    Dimensions,
} from 'react-native';

import {
    usePathname,
    useRouter,
} from 'expo-router';

import {
    Ionicons,
    MaterialIcons,
} from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const TABS = [
    {
        label: 'Home',
        icon: 'home-outline',
        activeIcon: 'home',
        type: 'ion',
        path: '/(protected)/(customer)',
    },
    {
        label: 'Services',
        icon: 'miscellaneous-services',
        activeIcon: 'miscellaneous-services',
        type: 'material',
        path: '/(protected)/(customer)/servexservice',
    },
    {
        label: 'Requests',
        icon: 'receipt-long',
        activeIcon: 'receipt-long',
        type: 'material',
        path: '/(protected)/(customer)/requests',
    },
    {
        label: 'Settings',
        icon: 'person-outline',
        activeIcon: 'person',
        type: 'ion',
        path: '/(protected)/(customer)/settings',
    },
];

export default function CustomBottomNavbar() {
    const router = useRouter();
    const pathname = usePathname();

    const activeIndex = TABS.findIndex((tab) =>
        pathname.startsWith(tab.path)
    );

    const handleNavigation = (path) => {
        if (pathname !== path) {
            router.replace(path);
        }
    };

    const renderIcon = (tab, isActive) => {
        const color = isActive ? '#3b82f6' : '#94a3b8';
        const iconName = isActive ? tab.activeIcon : tab.icon;

        if (tab.type === 'ion') {
            return (
                <Ionicons
                    name={iconName}
                    size={24}
                    color={color}
                />
            );
        }

        return (
            <MaterialIcons
                name={iconName}
                size={24}
                color={color}
            />
        );
    };

    return (
        <View style={styles.wrapper}>
            <View style={styles.container}>
                {TABS.map((tab, index) => {
                    const isActive = index === activeIndex;

                    return (
                        <TouchableOpacity
                            key={tab.label}
                            style={styles.tabButton}
                            activeOpacity={0.7}
                            onPress={() => handleNavigation(tab.path)}
                        >
                            <View style={styles.tabContent}>
                                <View
                                    style={[
                                        styles.iconWrapper,
                                        isActive && styles.activeIconWrapper,
                                    ]}
                                >
                                    {renderIcon(tab, isActive)}
                                </View>

                                <Text
                                    style={[
                                        styles.label,
                                        isActive && styles.activeLabel,
                                    ]}
                                >
                                    {tab.label}
                                </Text>
                            </View>
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
        bottom: 24,
        alignItems: 'center',
        zIndex: 1000,
    },

    container: {
        width: width - 32,
        height: 70,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 12,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.08,
        shadowRadius: 24,

        elevation: 10,

        borderWidth: 0.5,
        borderColor: '#e2e8f0',
    },

    tabButton: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    tabContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    iconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },

    activeIconWrapper: {
        backgroundColor: '#eff6ff',
    },

    label: {
        fontSize: 11,
        fontWeight: '500',
        color: '#94a3b8',
        letterSpacing: 0.3,
    },

    activeLabel: {
        color: '#3b82f6',
        fontWeight: '600',
    },
});
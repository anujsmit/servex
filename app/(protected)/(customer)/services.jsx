import React, {
    useEffect,
    useState,
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
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

const DUMMY_SERVICES = [
    {
        categoryId: 1,
        categoryName: 'Cleaning',
        services: [
            {
                id: '1',
                name: 'Full Home Cleaning',
                description:
                    'Complete deep cleaning for your entire house',
                price: 2500,
                imageUrl:
                    'https://images.unsplash.com/photo-1581578731548-c64695cc6952',
            },
            {
                id: '2',
                name: 'Kitchen Cleaning',
                description:
                    'Deep kitchen and chimney cleaning',
                price: 1800,
                imageUrl:
                    'https://images.unsplash.com/photo-1556911220-bff31c812dba',
            },
        ],
    },

    {
        categoryId: 2,
        categoryName: 'Plumbing',
        services: [
            {
                id: '3',
                name: 'Pipe Leakage Repair',
                description:
                    'Professional leakage repair service',
                price: 800,
                imageUrl:
                    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4',
            },
        ],
    },

    {
        categoryId: 3,
        categoryName: 'Electrical',
        services: [
            {
                id: '4',
                name: 'Fan Installation',
                description:
                    'Ceiling fan installation and repair',
                price: 1200,
                imageUrl:
                    'https://images.unsplash.com/photo-1621905251918-48416bd8575a',
            },
        ],
    },
];

export default function ServicesScreen() {
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        setTimeout(() => {
            setCategories(DUMMY_SERVICES);
            setLoading(false);
        }, 1000);
    }, []);

    const renderService = ({ item }) => {
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.card}
            >
                <Image
                    source={{
                        uri: item.imageUrl,
                    }}
                    style={styles.image}
                />

                <View style={styles.cardBody}>
                    <Text style={styles.serviceName}>
                        {item.name}
                    </Text>

                    <Text
                        numberOfLines={2}
                        style={styles.description}
                    >
                        {item.description}
                    </Text>

                    <View style={styles.footer}>
                        <Text style={styles.price}>
                            Rs. {item.price}
                        </Text>

                        <View style={styles.button}>
                            <MaterialIcons
                                name="arrow-forward"
                                size={18}
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
                    color="#2563eb"
                />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.header}>
                Explore Services
            </Text>

            {categories.map((category) => (
                <View
                    key={category.categoryId}
                    style={styles.section}
                >
                    <View style={styles.sectionHeader}>
                        <Text style={styles.categoryTitle}>
                            {category.categoryName}
                        </Text>

                        <Text style={styles.count}>
                            {category.services.length} services
                        </Text>
                    </View>

                    <FlatList
                        horizontal
                        data={category.services}
                        renderItem={renderService}
                        keyExtractor={(item) => item.id}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            paddingLeft: 16,
                            paddingRight: 6,
                        }}
                    />
                </View>
            ))}

            <View style={{ height: 120 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },

    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },

    header: {
        fontSize: 30,
        fontWeight: '700',
        color: '#0f172a',
        marginTop: 20,
        marginBottom: 24,
        paddingHorizontal: 20,
    },

    section: {
        marginBottom: 30,
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        paddingHorizontal: 20,
    },

    categoryTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0f172a',
    },

    count: {
        fontSize: 13,
        color: '#64748b',
    },

    card: {
        width: 250,
        backgroundColor: '#fff',
        borderRadius: 24,
        marginRight: 16,
        overflow: 'hidden',

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.08,
        shadowRadius: 10,

        elevation: 4,
    },

    image: {
        width: '100%',
        height: 160,
        backgroundColor: '#e2e8f0',
    },

    cardBody: {
        padding: 16,
    },

    serviceName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
    },

    description: {
        marginTop: 6,
        fontSize: 13,
        color: '#64748b',
        lineHeight: 20,
    },

    footer: {
        marginTop: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    price: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2563eb',
    },

    button: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
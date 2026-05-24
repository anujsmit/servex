import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { API_BASE_URL } from '../../../../lib/config';

const API_URL = `${API_BASE_URL}/api/platform-services`;

export default function ServicesScreen() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchServices = async () => {
        try {
            const response = await fetch(API_URL);

            const data = await response.json();

            if (data.success) {
                setCategories(data.categories);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
        >
            {categories.map((category) => (
                <View
                    key={category.categoryId}
                    style={styles.categorySection}
                >
                    <Text style={styles.categoryTitle}>
                        {category.categoryName}
                    </Text>

                    <FlatList
                        horizontal
                        data={category.services}
                        keyExtractor={(item) => item.id}
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View style={styles.card}>
                                <Image
                                    source={{
                                        uri: item.imageUrl,
                                    }}
                                    style={styles.image}
                                />

                                <Text style={styles.serviceName}>
                                    {item.name}
                                </Text>

                                <Text style={styles.description}>
                                    {item.description}
                                </Text>

                                <Text style={styles.price}>
                                    Rs. {item.price}
                                </Text>
                            </View>
                        )}
                    />
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        paddingTop: 20,
    },

    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    categorySection: {
        marginBottom: 24,
    },

    categoryTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 14,
        paddingHorizontal: 16,
        color: '#0f172a',
    },

    card: {
        width: 220,
        backgroundColor: '#fff',
        borderRadius: 18,
        marginLeft: 16,
        paddingBottom: 14,
        overflow: 'hidden',

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,

        elevation: 4,
    },

    image: {
        width: '100%',
        height: 140,
    },

    serviceName: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 10,
        paddingHorizontal: 12,
        color: '#0f172a',
    },

    description: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
        paddingHorizontal: 12,
    },

    price: {
        fontSize: 16,
        fontWeight: '700',
        color: '#3b82f6',
        marginTop: 10,
        paddingHorizontal: 12,
    },
});
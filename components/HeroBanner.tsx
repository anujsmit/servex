import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Image,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
    ActivityIndicator,
    useWindowDimensions,
    Animated,
} from 'react-native';
import { API_BASE_URL } from '../lib/config';
import {
    customerBrand,
    customerDashboardColors as C,
} from '../lib/customerDashboardTokens';

const H_INSET = 0;
const CARD_HEIGHT = 200;
const SECTION_PADDING_TOP = 0;
const SECTION_PADDING_BOTTOM = 0;

interface Banner {
    id: string;
    imageUrl: string;
    title?: string;
    subtitle?: string;
    linkUrl?: string;
}

export const HeroBanner: React.FC = () => {
    const { width: windowWidth } = useWindowDimensions();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    useEffect(() => {
        let cancelled = false;
        const fetchBanners = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/hero-banners`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                if (!cancelled) setBanners(data.banners ?? []);
            } catch {
                // silently fall back to no banners
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchBanners();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(() => {
            setActiveIndex((current) => {
                const next = (current + 1) % banners.length;
                scrollViewRef.current?.scrollTo({ x: next * windowWidth, animated: true });
                return next;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [banners.length, windowWidth]);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
        setActiveIndex(index);
    };

    const handleManualScroll = (index: number) => {
        setActiveIndex(index);
        scrollViewRef.current?.scrollTo({ x: index * windowWidth, animated: true });
    };

    const cardShellStyle = {
        width: windowWidth,
        height: CARD_HEIGHT,
        borderRadius: 0,
        overflow: 'hidden' as const,
        backgroundColor: C.cardFill,
    };

    if (loading) {
        return (
            <Animated.View 
                style={[
                    styles.section,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                    }
                ]}
            >
                <View style={[styles.cardShell, cardShellStyle]}>
                    <View style={styles.loadingInner}>
                        <ActivityIndicator size="large" color={customerBrand.accent} />
                    </View>
                </View>
            </Animated.View>
        );
    }

    if (banners.length === 0) {
        return null;
    }

    return (
        <Animated.View 
            style={[
                styles.section,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                }
            ]}
        >
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                decelerationRate="fast"
                style={styles.slider}
            >
                {banners.map((banner) => (
                    <View key={banner.id} style={[styles.slidePage, { width: windowWidth }]}>
                        <TouchableOpacity 
                            activeOpacity={0.95} 
                            style={styles.cardPressable}
                            onPress={() => {
                                if (banner.linkUrl) {
                                    // Handle navigation
                                    console.log('Navigate to:', banner.linkUrl);
                                }
                            }}
                        >
                            <View style={[styles.cardShell, cardShellStyle]}>
                                <Image
                                    source={{ uri: banner.imageUrl }}
                                    style={styles.bannerImage}
                                    resizeMode="cover"
                                    onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>

            {banners.length > 1 && (
                <View style={styles.pagination}>
                    {banners.map((_, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => handleManualScroll(index)}
                            activeOpacity={0.7}
                        >
                            <View 
                                style={[
                                    styles.dot, 
                                    index === activeIndex && styles.activeDot,
                                ]} 
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    section: {
        width: '100%',
        paddingTop: SECTION_PADDING_TOP,
        paddingBottom: SECTION_PADDING_BOTTOM,
        backgroundColor: 'transparent',
        marginBottom: 8,
    },
    slider: {
        backgroundColor: 'transparent',
    },
    slidePage: {
        backgroundColor: 'transparent',
    },
    cardShell: {
        backgroundColor: C.cardFill,
    },
    cardPressable: {
        width: '100%',
        flex: 1,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    loadingInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: CARD_HEIGHT,
        backgroundColor: '#f5f7fb',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(15, 23, 42, 0.3)',
    },
    activeDot: {
        backgroundColor: customerBrand.accent,
        width: 24,
    },
});
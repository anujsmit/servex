import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Image,
    Text,  // Make sure Text is imported
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

const CARD_HEIGHT = 180;
const AUTO_SCROLL_INTERVAL = 5000;

interface Banner {
    id: string;
    imageUrl: string;
    title?: string;
    subtitle?: string;
    linkUrl?: string;
    videoUrl?: string;
    adType?: string;
}

interface HeroBannerProps {
    banners?: Banner[];
    adType?: 'ad1' | 'ad2' | 'both';
    autoScroll?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ 
    banners: propBanners, 
    adType = 'ad1',
    autoScroll = true 
}) => {
    const { width: windowWidth } = useWindowDimensions();
    const [internalBanners, setInternalBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    const banners = propBanners || internalBanners;

    useEffect(() => {
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
        ]).start();
    }, []);

    useEffect(() => {
        if (!propBanners) {
            let cancelled = false;
            const fetchBanners = async () => {
                try {
                    const url = `${API_BASE_URL}/api/hero-banners/type/${adType}`;
                    const res = await fetch(url);
                    if (!res.ok) throw new Error('Failed to fetch');
                    const data = await res.json();
                    if (!cancelled && data.success && data.banners) {
                        setInternalBanners(data.banners);
                    }
                } catch (error) {
                    console.log('Failed to fetch banners:', error);
                } finally {
                    if (!cancelled) setLoading(false);
                }
            };
            fetchBanners();
            return () => {
                cancelled = true;
            };
        } else {
            setLoading(false);
        }
    }, [propBanners, adType]);

    useEffect(() => {
        if (!autoScroll || banners.length <= 1) return;
        
        const interval = setInterval(() => {
            setActiveIndex((current) => {
                const next = (current + 1) % banners.length;
                scrollViewRef.current?.scrollTo({ x: next * windowWidth, animated: true });
                return next;
            });
        }, AUTO_SCROLL_INTERVAL);
        
        return () => clearInterval(interval);
    }, [banners.length, windowWidth, autoScroll]);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
        setActiveIndex(index);
    };

    const handleManualScroll = (index: number) => {
        setActiveIndex(index);
        scrollViewRef.current?.scrollTo({ x: index * windowWidth, animated: true });
    };

    const cardWidth = windowWidth - 32;

    if (loading) {
        return (
            <Animated.View 
                style={[
                    styles.section,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}
            >
                <View style={[styles.cardShell, { width: cardWidth, height: CARD_HEIGHT }]}>
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
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
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
            >
                {banners.map((banner, index) => (
                    <View key={banner.id || index} style={[styles.slidePage, { width: windowWidth }]}>
                        <TouchableOpacity 
                            activeOpacity={0.95} 
                            style={styles.cardPressable}
                            onPress={() => {
                                if (banner.linkUrl) {
                                    console.log('Navigate to:', banner.linkUrl);
                                }
                            }}
                        >
                            <View style={[styles.cardShell, { width: cardWidth, height: CARD_HEIGHT }]}>
                                <Image
                                    source={{ uri: banner.imageUrl }}
                                    style={styles.bannerImage}
                                    resizeMode="cover"
                                    onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                                />
                                {banner.title && (
                                    <View style={styles.textOverlay}>
                                        <Text style={styles.title}>{banner.title}</Text>
                                        {banner.subtitle && (
                                            <Text style={styles.subtitle}>{banner.subtitle}</Text>
                                        )}
                                    </View>
                                )}
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
        paddingVertical: 8,
        alignItems: 'center',
    },
    slidePage: {
        alignItems: 'center',
    },
    cardShell: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: C.cardFill,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardPressable: {
        width: '100%',
        flex: 1,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    textOverlay: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    subtitle: {
        fontSize: 13,
        color: '#fff',
        marginTop: 4,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    loadingInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
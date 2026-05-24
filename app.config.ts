import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "ServeX",
    slug: "servex",
    version: "1.0.0",
    description: "ServeX - Your trusted home service partner. Connect with verified electricians and plumbers in your area. Book services instantly, track professionals in real-time, and get quality service at your doorstep.",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "servex",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
        supportsTablet: true,
        infoPlist: {
            UIStatusBarStyle: "UIStatusBarStyleDarkContent",
            UIViewControllerBasedStatusBarAppearance: false
        },
        bundleIdentifier: "np.com.linkbinary.servexapp",
        config: {
            usesNonExemptEncryption: false
        }
    },
    android: {
        adaptiveIcon: {
            foregroundImage: "./assets/images/adaptive-icon.png",
            backgroundColor: "#ffffff"
        },
        config: {
            googleMaps: {
                apiKey: process.env.GOOGLE_MAPS_API_KEY
            }
        },
        softwareKeyboardLayoutMode: "pan",
        edgeToEdgeEnabled: true,
        package: "np.com.linkbinary.servexapp",
        playStoreUrl: "https://play.google.com/store/apps/details?id=np.com.linkbinary.servexapp",
        permissions: [
            "RECEIVE_BOOT_COMPLETED",
            "VIBRATE",
            "POST_NOTIFICATIONS"
        ]
    },
    plugins: [
        "expo-router",
        [
            "expo-splash-screen",
            {
                image: "./assets/images/splash-icon.png",
                imageWidth: 200,
                resizeMode: "contain",
                backgroundColor: "#ffffff"
            }
        ],
        "expo-secure-store",
        "expo-font",
        "expo-web-browser",
        [
            "expo-notifications",
            {
                icon: "./assets/images/notification-icon.png",
                color: "#ffffff",
                sounds: [
                    "./assets/sounds/notification.mp3"
                ],
                androidMode: "default",
                androidCollapsedTitle: "#{unread_notifications} new notifications"
            }
        ],
        [
            "expo-image-picker",
            {
                "cameraPermission": "Allow ServeX to access your camera to capture your profile picture and ID documents for verification.",
                "photosPermission": "Allow ServeX to access your photos." // Keep this minimal as we won't use it much
            }
        ],
        [
            "expo-location",
            {
                isAndroidBackgroundLocationEnabled: false,
                locationWhenInUsePermission:
                    "ServeX needs your location while you use the app to find and connect you with nearby service professionals."
            }
        ]
    ],
    experiments: {
        typedRoutes: true
    },
    extra: {
        router: {},
        eas: {
            projectId: "8b6c889a-64ca-44df-bfbe-e6d835f2fa69"
        }
    },
    owner: "servexappnp"
});

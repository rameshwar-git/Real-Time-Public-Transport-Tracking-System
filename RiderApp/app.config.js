import 'dotenv/config';

export default {
  expo: {
    name: "RiderApp",
    slug: "RiderApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "justintime",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.admin.dev.justintime.rider",
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "We use your location to show nearby data."
      }
    },

    android: {
      package: "com.admin.dev.justintime.rider",
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      },
      permissions: [
        "ACCESS_FINE_LOCATION"
      ],
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage:
          "./assets/images/android-icon-foreground.png",
        backgroundImage:
          "./assets/images/android-icon-background.png",
        monochromeImage:
          "./assets/images/android-icon-monochrome.png",
      },
    },

    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      "expo-build-properties",
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    extra: {
      router: {},
      eas: {
        projectId: "773ae029-c0fc-47b0-85f3-819511704106",
      },
    },
  },
};
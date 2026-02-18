import 'dotenv/config';

export default {
  expo: {
    scheme: "justintime",
    android: {
      package: "com.admin.dev.justintime",
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    }
  }
};
type Env = {
  API_URL: string;
  ENV: "development" | "production";
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: string;
};
export const env:Env = {
  API_URL: process.env.EXPO_PUBLIC_API_URL as string,
  ENV: process.env.EXPO_PUBLIC_ENV as Env["ENV"],
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_MAP_API_KEY as string,
};

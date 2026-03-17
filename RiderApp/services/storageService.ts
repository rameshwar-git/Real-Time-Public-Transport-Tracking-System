import AsyncStorage from "@react-native-async-storage/async-storage";

import * as SecureStore from "expo-secure-store";

const KEY = "auth_token";


export const getUserId = async () => {
    return await AsyncStorage.getItem("userId");
};
export const saveToken = (token: string) =>
  SecureStore.setItemAsync(KEY, token);

export const getToken = () =>
  SecureStore.getItemAsync(KEY);

export const removeToken = () =>
  SecureStore.deleteItemAsync(KEY);
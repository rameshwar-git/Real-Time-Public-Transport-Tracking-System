import AsyncStorage from "@react-native-async-storage/async-storage";

export const getUserId = async () => {
    return await AsyncStorage.getItem("userId");
};

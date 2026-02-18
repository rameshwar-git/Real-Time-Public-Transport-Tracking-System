import { router } from "expo-router";
import { env } from "@/config/env";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = env.API_URL;

type AuthPayLoad = {
    email: string;
    password: string;
}

export const handleSignIn = async ({ email, password }: AuthPayLoad) => {
    try {

        const validate = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email,
                password: password
            }),
        });
        const result = await validate.json();
        if (result.message === "SUCCESS") {
            await AsyncStorage.setItem("userId", result.userId);
            router.replace("/(tabs)");
        } else {
            console.log("login fail");
            return "FAIL";
        }
    } catch (err: any) {
        console.log(err.message);
    }
};

export const validate = async (_id:String) => {
    try{
         const data =await fetch(`${API_URL}/validate/:${_id}`,{
        method: "GET",
        headers:  { "Content-Type": "application/json" },
    })
    if(data.status===400){
        return data.status;
    }
    } catch(err:any){
        console.log(err.message);
    }
};

export const handleLogout = async () => {
    await AsyncStorage.removeItem("userId");
    router.replace("/auth/signin");
};
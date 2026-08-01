import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL=process.env.API_URL;


export interface LoginResponse {
    token:string;
    user?:any;
}

export interface ApiError {
    token:string;
    user?:any;
}

export async function login(email:string, password:string) {
    try{
        const response =await fetch(`${API_URL}/login`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        const data: LoginResponse & ApiError =await response.json();
        if(!response.ok){
           // throw new Error(data.message || 'Login Failed');
        }

        //save token if success
        await AsyncStorage.setItem('token',data.token);
        return data;

    } catch(err:any){
       // throw new Error(DataTransfer.message || 'Network Error');
    }
}
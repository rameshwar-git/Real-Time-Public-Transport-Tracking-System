import { env } from "@/config/env";
import { getToken } from "./tokenStorage";

const API_URL = env.API_URL;

export const authFetch = async (url: string, options: any = {}) => {
  const token = await getToken();

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  return res;
};
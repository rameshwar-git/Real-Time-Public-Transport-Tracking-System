import { env } from "@/config/env";

const API_URL = env.API_URL;

export const loginRequest = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return res.json();
};

export const validateTokenRequest = async (token: string) => {
  const res = await fetch(`${API_URL}/validate`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.ok;
};
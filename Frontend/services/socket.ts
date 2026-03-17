import { io } from "socket.io-client";
import { env } from "@/config/env";
import AsyncStorage from "@react-native-async-storage/async-storage";

const URL = env.API_URL.replace(/\/api\/?$/, "");

export const socket = io(URL, {
  transports: ["websocket"],
  autoConnect: false,
});
// Tell Server User is Online.
export const connectSocket = async () => {
  const userId = await AsyncStorage.getItem("userId");
  if (!userId) return;

  socket.auth = { userId };

  socket.off("connect");

  socket.on("connect", () => {
    console.log("Connected:", socket.id);
    socket.emit("go-online");
  });

  socket.connect();
};
// Tell Server User is Offline.
export const disconnectSocket = async () => {
  if (!socket.connected) return;

  socket.off("disconnect");

  socket.on("disconnect", () => {
    console.log("Disconnected");
  });

  socket.disconnect();
};
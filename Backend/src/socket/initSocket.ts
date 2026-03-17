import PassengerModel from "@/models/users/UserPassengerModel";

export default function initSocket(io:any) {
  io.on("connection", (socket:any) => {
    console.log("User connected");

    const userId = socket.handshake.auth.userId;

    // ONLINE
    socket.on("go-online", async () => {
      await PassengerModel.findByIdAndUpdate(userId, {
        status: "ONLINE",
        lastSeen: new Date(),
      });
    });

    // OFFLINE
    socket.on("disconnect", async () => {
      await PassengerModel.findByIdAndUpdate(userId, {
        status: "OFFLINE",
        lastSeen: new Date(),
      });
      console.log("User disconnected");
    });
  });
}
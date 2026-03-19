import PassengerModel from "@/models/users/UserPassengerModel";

const connectedUsers = new Map<string, string>(); // userId -> socketId

export default function initSocket(io:any) {
  io.on("connection", (socket:any) => {
    console.log("User connected");

    const userId = socket.handshake.auth.userId;
    if (userId) {
        connectedUsers.set(userId, socket.id);
    }

    // ONLINE
    socket.on("go-online", async () => {
      if (userId) {
        await PassengerModel.findByIdAndUpdate(userId, {
          status: "ONLINE",
          lastSeen: new Date(),
        });
      }
    });

    socket.on("request-ride", (data: any) => {
        const { passengerId, driverId, origin, destination } = data;
        const driverSocketId = connectedUsers.get(driverId);
        
        if (driverSocketId) {
            console.log(`Assigning ride to driver ${driverId} for passenger ${passengerId}`);
            io.to(driverSocketId).emit("ride-assigned", { passengerId, origin, destination });
        } else {
            console.log(`Driver ${driverId} not currently connected to sockets.`);
        }
    });

    // OFFLINE
    socket.on("disconnect", async () => {
      if (userId) {
          connectedUsers.delete(userId);
          await PassengerModel.findByIdAndUpdate(userId, {
            status: "OFFLINE",
            lastSeen: new Date(),
          });
      }
      console.log("User disconnected");
    });
  });
}
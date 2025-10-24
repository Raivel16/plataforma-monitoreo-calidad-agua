import http from "http";
import { Server } from "socket.io";
import app, { configurarRutas } from "./src/app.js";

const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // o la URL de tu frontend
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

// Inicializar rutas (pasando io)
configurarRutas(io);

// Eventos de Socket.IO
io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado:", socket.id);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});

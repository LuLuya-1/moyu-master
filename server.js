import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { Server } from "socket.io";
import { RoomManager } from "./server/room-manager.js";

const root = path.dirname(fileURLToPath(import.meta.url));

export function createServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);
  const rooms = new RoomManager();

  app.get("/", (_request, response) => response.sendFile(path.join(root, "index.html")));
  app.get("/style.css", (_request, response) => response.sendFile(path.join(root, "style.css")));
  app.use("/src", express.static(path.join(root, "src"), { index: false, fallthrough: false }));
  app.get("/health", (_request, response) => response.json({ ok: true }));

  function sendState(room) {
    for (const member of room.members) {
      if (member.socketId) io.to(member.socketId).emit("room:state", rooms.publicState(room, member.token));
    }
  }

  function action(handler) {
    return async (payload = {}, acknowledge = () => {}) => {
      try {
        const result = await handler(payload);
        acknowledge({ ok: true, ...result });
      } catch (error) {
        acknowledge({ ok: false, error: error.message || "操作失败" });
      }
    };
  }

  io.on("connection", (socket) => {
    socket.on("room:create", action(({ name }) => {
      const { room, token } = rooms.createRoom(name, socket.id);
      socket.join(room.code);
      sendState(room);
      return { code: room.code, token };
    }));

    socket.on("room:join", action(({ code, name }) => {
      const { room, token } = rooms.joinRoom(code, name, socket.id);
      socket.join(room.code);
      sendState(room);
      return { code: room.code, token };
    }));

    socket.on("room:resume", action(({ code, token }) => {
      const room = rooms.resumeRoom(code, token, socket.id);
      socket.join(room.code);
      sendState(room);
      return { code: room.code };
    }));

    const roomAction = (event, operation) => {
      socket.on(event, action((payload) => {
        const room = rooms.getRoom(payload.code);
        if (event.startsWith("game:") || event.startsWith("risk:")) {
          rooms.requirePlaying(room);
          rooms.requireCurrentTurn(room, payload.turnId);
        }
        operation(room, payload.token, payload);
        sendState(room);
        return {};
      }));
    };

    roomAction("room:start", (room, token) => rooms.startGame(room, token));
    roomAction("game:buy", (room, token, payload) => rooms.buy(room, token, payload.type, payload.index));
    roomAction("game:pass", (room, token) => rooms.pass(room, token));
    roomAction("game:discard", (room, token, payload) => rooms.discard(room, token, payload.type, payload.index));
    roomAction("risk:vote", (room, token, payload) => rooms.vote(room, token, payload.cardId));
    roomAction("risk:choose", (room, token, payload) => rooms.chooseRisk(room, token, payload.cardId));

    socket.on("disconnect", () => {
      const room = rooms.disconnect(socket.id);
      if (room) sendState(room);
    });
  });

  return { app, server, io, rooms };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 8765;
  const { server } = createServer();
  server.listen(port, "0.0.0.0", () => {
    console.log(`摸鱼大师联机服务器已启动：http://localhost:${port}`);
  });
}

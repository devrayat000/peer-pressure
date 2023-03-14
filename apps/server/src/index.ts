import "dotenv/config";
import { createServer } from "node:http";
import express from "express";
import { Server } from "socket.io";
import { ExpressPeerServer } from "peer";
import cors, { type CorsOptions } from "cors";
import logger from "morgan";

const corsOpts: CorsOptions = {
  origin: "*",
  credentials: true,
};

const app = express();
app.use(cors(corsOpts));
app.use(logger("dev"));

const server = createServer(app);
const io = new Server(server, {
  cors: corsOpts,
});

const peer = ExpressPeerServer(server, {
  path: "/pressure",
  corsOptions: corsOpts,
});
app.use("/peer", peer);
app.get("/health", (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
  });
});

peer.on("error", (err) => {
  console.log(err.message);
});

peer.on("connection", (client) => {
  console.log("clientId:", client.getId());
  console.log("clientToken:", client.getToken());
});

peer.on("message", (_, message) => {
  console.log("msg:", message);
});

server.listen(4000);

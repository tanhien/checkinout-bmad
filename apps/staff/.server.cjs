"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_http = require("http");
var import_url = require("url");
var import_next = __toESM(require("next"));
var import_socket = require("socket.io");
var import_redis_adapter = require("@socket.io/redis-adapter");
var import_redis = require("redis");

// src/lib/auth.ts
var import_jose = require("jose");
var import_headers = require("next/headers");
var import_server = require("next/server");
var COOKIE_NAME = "staff_token";
var SESSION_DURATION_NORMAL = 8 * 60 * 60;
var SESSION_DURATION_REMEMBER = 30 * 24 * 60 * 60;
function getJwtSecret() {
  const secret = process.env["STAFF_JWT_SECRET"];
  if (!secret || secret.length < 32) {
    throw new Error("STAFF_JWT_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}
async function verifyStaffToken(token) {
  try {
    const { payload } = await (0, import_jose.jwtVerify)(token, getJwtSecret());
    if (typeof payload["staffId"] !== "string" || typeof payload["role"] !== "string" || typeof payload["propertyId"] !== "string") {
      return null;
    }
    return {
      staffId: payload["staffId"],
      role: payload["role"],
      propertyId: payload["propertyId"]
    };
  } catch {
    return null;
  }
}

// server.ts
var dev = process.env["NODE_ENV"] !== "production";
var hostname = "localhost";
var port = parseInt(process.env["PORT"] ?? "3001", 10);
var app = (0, import_next.default)({ dev, hostname, port });
var handle = app.getRequestHandler();
app.prepare().then(() => {
  const httpServer = (0, import_http.createServer)(async (req, res) => {
    const parsedUrl = (0, import_url.parse)(req.url ?? "", true);
    await handle(req, res, parsedUrl);
  });
  const io = new import_socket.Server(httpServer, {
    cors: { origin: "*", credentials: true }
  });
  const useRedis = process.env["UPSTASH_REDIS_URL"] && process.env["UPSTASH_REDIS_TOKEN"];
  if (useRedis) {
    const redisClient = (0, import_redis.createClient)({
      url: process.env["UPSTASH_REDIS_URL"],
      password: process.env["UPSTASH_REDIS_TOKEN"]
    });
    redisClient.on("error", (err) => console.error("[Redis error]", err));
    redisClient.on("connect", () => console.log("[Redis connected]"));
    redisClient.connect().then(() => {
      const pubClient = redisClient.duplicate();
      pubClient.connect();
      io.adapter((0, import_redis_adapter.createAdapter)(pubClient, pubClient));
      console.log("[Socket.io] Using Redis adapter");
    });
  } else {
    console.log("[Socket.io] Using in-memory adapter (dev mode)");
  }
  const staffNamespace = io.of("/staff");
  staffNamespace.use(async (socket, next2) => {
    try {
      const token = socket.handshake.headers.cookie?.split("; ").find((c) => c.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
      if (!token) {
        return next2(new Error("Missing staff token"));
      }
      const session = await verifyStaffToken(token);
      if (!session) {
        return next2(new Error("Invalid token"));
      }
      ;
      socket.session = session;
      next2();
    } catch (err) {
      next2(new Error("Auth error"));
    }
  });
  staffNamespace.on("connection", (socket) => {
    const session = socket.session;
    console.log(`[/staff] Connected: ${socket.id} (staff: ${session.staffId})`);
    socket.join(`property:${session.propertyId}`);
    socket.on("alert:dismiss", (data) => {
      staffNamespace.to(`property:${session.propertyId}`).emit("alert:dismissed", { alertId: data.alertId, dismissedBy: session.staffId });
    });
    socket.on("disconnect", () => {
      console.log(`[/staff] Disconnected: ${socket.id}`);
    });
  });
  global.staffIO = staffNamespace;
  const kioskNamespace = io.of("/kiosk");
  kioskNamespace.use((socket, next2) => {
    const apiKey = socket.handshake.query["apiKey"];
    if (!apiKey) {
      return next2(new Error("Missing API key"));
    }
    ;
    socket.kioskApiKey = apiKey;
    next2();
  });
  kioskNamespace.on("connection", (socket) => {
    const apiKey = socket.kioskApiKey;
    console.log(`[/kiosk] Connected: ${socket.id} (key: ${apiKey})`);
    socket.on("disconnect", () => {
      console.log(`[/kiosk] Disconnected: ${socket.id}`);
    });
  });
  global.kioskIO = kioskNamespace;
  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io listening on /socket.io`);
  });
});

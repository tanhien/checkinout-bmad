import { createServer } from "http"
import { parse } from "url"
import next from "next"
import { Server as SocketIOServer } from "socket.io"
import { createAdapter } from "@socket.io/redis-adapter"
import { createClient } from "redis"
import { verifyStaffToken, COOKIE_NAME } from "./src/lib/auth"

const dev = process.env["NODE_ENV"] !== "production"
const hostname = "localhost"
const port = parseInt(process.env["PORT"] ?? "3001", 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    const parsedUrl = parse(req.url ?? "", true)
    await handle(req, res, parsedUrl)
  })

  // ─── Socket.io setup ────────────────────────────────────────────────────

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*", credentials: true },
  })

  // Redis adapter (if UPSTASH_REDIS_URL set) — otherwise in-memory for dev
  const useRedis =
    process.env["UPSTASH_REDIS_URL"] && process.env["UPSTASH_REDIS_TOKEN"]

  if (useRedis) {
    const redisClient = createClient({
      url: process.env["UPSTASH_REDIS_URL"],
      password: process.env["UPSTASH_REDIS_TOKEN"],
    })

    redisClient.on("error", (err) => console.error("[Redis error]", err))
    redisClient.on("connect", () => console.log("[Redis connected]"))

    redisClient.connect().then(() => {
      const pubClient = redisClient.duplicate()
      pubClient.connect()

      io.adapter(createAdapter(pubClient, pubClient))
      console.log("[Socket.io] Using Redis adapter")
    })
  } else {
    console.log("[Socket.io] Using in-memory adapter (dev mode)")
  }

  // ─── Namespace: /staff ──────────────────────────────────────────────────

  const staffNamespace = io.of("/staff")

  staffNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.headers.cookie
        ?.split("; ")
        .find((c) => c.startsWith(`${COOKIE_NAME}=`))
        ?.slice(COOKIE_NAME.length + 1)

      if (!token) {
        return next(new Error("Missing staff token"))
      }

      const session = await verifyStaffToken(token)
      if (!session) {
        return next(new Error("Invalid token"))
      }

      // Attach session to socket for use in event handlers
      ;(socket as any).session = session
      next()
    } catch (err) {
      next(new Error("Auth error"))
    }
  })

  staffNamespace.on("connection", (socket) => {
    const session = (socket as any).session
    console.log(`[/staff] Connected: ${socket.id} (staff: ${session.staffId})`)

    // Auto-join property room
    socket.join(`property:${session.propertyId}`)

    // E6-S3: Broadcast alert dismiss to all staff in the same property
    socket.on("alert:dismiss", (data: { alertId: string }) => {
      staffNamespace
        .to(`property:${session.propertyId}`)
        .emit("alert:dismissed", { alertId: data.alertId, dismissedBy: session.staffId })
    })

    socket.on("disconnect", () => {
      console.log(`[/staff] Disconnected: ${socket.id}`)
    })
  })

  // Emit helper for API routes
  ;(global as any).staffIO = staffNamespace

  // ─── Namespace: /kiosk ──────────────────────────────────────────────────

  const kioskNamespace = io.of("/kiosk")

  kioskNamespace.use((socket, next) => {
    const apiKey = socket.handshake.query["apiKey"]
    if (!apiKey) {
      return next(new Error("Missing API key"))
    }

    // In production, verify apiKey against DB; for now, accept any non-empty key
    ;(socket as any).kioskApiKey = apiKey
    next()
  })

  kioskNamespace.on("connection", (socket) => {
    const apiKey = (socket as any).kioskApiKey
    console.log(`[/kiosk] Connected: ${socket.id} (key: ${apiKey})`)

    socket.on("disconnect", () => {
      console.log(`[/kiosk] Disconnected: ${socket.id}`)
    })
  })

  ;(global as any).kioskIO = kioskNamespace

  // ─── Start server ───────────────────────────────────────────────────────

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Socket.io listening on /socket.io`)
  })
})

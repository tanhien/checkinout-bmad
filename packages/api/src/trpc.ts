import { initTRPC, TRPCError } from "@trpc/server"
import type { RequestContext, StaffRole, StaffAuth, KioskAuth } from "./context"

const t = initTRPC.context<RequestContext>().create({
  errorFormatter: ({ shape, error }) => {
    if (process.env["NODE_ENV"] !== "production") {
      console.error("[tRPC Error]", error.code, error.message)
    }
    return {
      ...shape,
      // Hide internal error details from clients in production
      message:
        process.env["NODE_ENV"] === "production" && error.code === "INTERNAL_SERVER_ERROR"
          ? "An unexpected error occurred"
          : shape.message,
    }
  },
})

export const router = t.router
export const createCallerFactory = t.createCallerFactory

// ─── publicProcedure — no auth required ──────────────────────────────────────

export const publicProcedure = t.procedure

// ─── staffProcedure — requires valid staff JWT ────────────────────────────────

const requireStaff = t.middleware(({ ctx, next }) => {
  if (!ctx.auth || ctx.auth.type !== "staff") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Staff authentication required" })
  }
  // Narrow auth type to StaffAuth for downstream procedures
  return next({
    ctx: {
      ...ctx,
      auth: ctx.auth as StaffAuth,
      propertyId: ctx.auth.propertyId,
    },
  })
})

export const staffProcedure = t.procedure.use(requireStaff)

// ─── managerProcedure — staff + Manager or Admin role ────────────────────────

const MANAGER_ROLES: StaffRole[] = ["ADMIN", "MANAGER"]

const requireManager = requireStaff.unstable_pipe(({ ctx, next }) => {
  if (!MANAGER_ROLES.includes(ctx.auth.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Manager or Admin role required" })
  }
  return next({ ctx })
})

export const managerProcedure = t.procedure.use(requireManager)

// ─── adminProcedure — Admin only ─────────────────────────────────────────────

const requireAdmin = requireStaff.unstable_pipe(({ ctx, next }) => {
  if (ctx.auth.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin role required" })
  }
  return next({ ctx })
})

export const adminProcedure = t.procedure.use(requireAdmin)

// ─── kioskProcedure — requires valid X-Kiosk-Api-Key header ──────────────────

const requireKiosk = t.middleware(({ ctx, next }) => {
  if (!ctx.auth || ctx.auth.type !== "kiosk") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Kiosk API key required" })
  }
  return next({
    ctx: {
      ...ctx,
      auth: ctx.auth as KioskAuth,
      propertyId: ctx.auth.propertyId,
    },
  })
})

export const kioskProcedure = t.procedure.use(requireKiosk)

// ─── guestProcedure — requires valid guest JWT ────────────────────────────────

const requireGuest = t.middleware(({ ctx, next }) => {
  if (!ctx.auth || ctx.auth.type !== "guest") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Guest authentication required" })
  }
  return next({ ctx: { ...ctx, auth: ctx.auth } })
})

export const guestProcedure = t.procedure.use(requireGuest)

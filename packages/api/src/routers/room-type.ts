import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, staffProcedure, adminProcedure } from "../trpc"
import { roomPhotoKey } from "../lib/storage"

const slugSchema = z
  .string()
  .max(80)
  .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and dashes")

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}

export const roomTypeRouter = router({
  list: staffProcedure
    .input(z.object({ includeInactive: z.boolean().default(false) }).optional())
    .query(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }
      return ctx.db.roomType.findMany({
        where: {
          propertyId: ctx.propertyId,
          ...(input?.includeInactive ? {} : { isActive: true }),
        },
        include: {
          amenities: {
            include: { amenity: true },
          },
          _count: {
            select: { rooms: { where: { isActive: true } } },
          },
        },
        orderBy: { name: "asc" },
      })
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: slugSchema.optional(),
        description: z.string().optional(),
        areaM2: z.number().positive().optional(),
        maxAdults: z.number().int().min(1),
        maxChildren: z.number().int().min(0).default(2),
        bedType: z.enum(["SINGLE", "DOUBLE", "TWIN", "KING", "QUEEN", "BUNK"]),
        basePrice: z.number().positive(),
        photoUrls: z.array(z.string()).default([]),
        isFeatured: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }
      const slug = input.slug ?? generateSlug(input.name)

      const slugCheck = slugSchema.safeParse(slug)
      if (!slugCheck.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid slug: ${slugCheck.error.errors[0]?.message ?? "invalid format"}`,
        })
      }

      const existing = await ctx.db.roomType.findUnique({
        where: { propertyId_slug: { propertyId: ctx.propertyId, slug } },
      })
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Slug "${slug}" is already taken. Provide a different slug.`,
        })
      }

      const roomType = await ctx.db.roomType.create({
        data: {
          propertyId: ctx.propertyId,
          name: input.name,
          slug,
          description: input.description,
          areaM2: input.areaM2,
          maxAdults: input.maxAdults,
          maxChildren: input.maxChildren,
          bedType: input.bedType,
          basePrice: input.basePrice,
          photoUrls: input.photoUrls,
          isFeatured: input.isFeatured,
        },
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "RoomType",
          entityId: roomType.id,
          action: "CREATE",
          changes: { name: input.name, slug, basePrice: String(input.basePrice) },
        },
      })

      return roomType
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        slug: slugSchema.optional(),
        description: z.string().nullish(),
        areaM2: z.number().positive().nullish(),
        maxAdults: z.number().int().min(1).optional(),
        maxChildren: z.number().int().min(0).optional(),
        bedType: z.enum(["SINGLE", "DOUBLE", "TWIN", "KING", "QUEEN", "BUNK"]).optional(),
        basePrice: z.number().positive().optional(),
        photoUrls: z.array(z.string()).optional(),
        isFeatured: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }
      const { id, ...data } = input

      const roomType = await ctx.db.roomType.findFirst({
        where: { id, propertyId: ctx.propertyId },
      })
      if (!roomType) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room type not found" })
      }

      if (data.slug) {
        const conflict = await ctx.db.roomType.findFirst({
          where: { propertyId: ctx.propertyId, slug: data.slug, id: { not: id } },
        })
        if (conflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Slug "${data.slug}" is already taken by another room type`,
          })
        }
      }

      const updated = await ctx.db.roomType.update({
        where: { id },
        data,
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "RoomType",
          entityId: id,
          action: "UPDATE",
          changes: JSON.parse(JSON.stringify(data)),
        },
      })

      return updated
    }),

  toggleActive: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }

      const roomType = await ctx.db.roomType.findFirst({
        where: { id: input.id, propertyId: ctx.propertyId },
      })
      if (!roomType) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room type not found" })
      }

      const updated = await ctx.db.roomType.update({
        where: { id: input.id },
        data: { isActive: !roomType.isActive },
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "RoomType",
          entityId: input.id,
          action: updated.isActive ? "ACTIVATE" : "DEACTIVATE",
          changes: { isActive: updated.isActive },
        },
      })

      return updated
    }),

  // ── E1-S7: Reorder or remove a room photo ─────────────────────────────────
  updatePhotos: adminProcedure
    .input(z.object({ id: z.string(), photoUrls: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) throw new TRPCError({ code: "BAD_REQUEST", message: "No property" })
      const rt = await ctx.db.roomType.findFirst({ where: { id: input.id, propertyId: ctx.propertyId } })
      if (!rt) throw new TRPCError({ code: "NOT_FOUND", message: "Room type not found" })
      return ctx.db.roomType.update({
        where: { id: input.id },
        data: { photoUrls: input.photoUrls },
      })
    }),

  // ── E1-S7: Get presigned upload URL + final photo URL ─────────────────────
  getPhotoUploadUrl: adminProcedure
    .input(z.object({ roomTypeId: z.string(), filename: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) throw new TRPCError({ code: "BAD_REQUEST", message: "No property" })
      const key = roomPhotoKey(input.roomTypeId, input.filename)
      // Return the key — actual presigned URL is generated by the staff upload API route
      // (avoids sending AWS credentials to the browser)
      return { key, uploadPath: `/api/upload/room-photo` }
    }),
})

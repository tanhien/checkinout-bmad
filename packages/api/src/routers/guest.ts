import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, staffProcedure } from "../trpc"
import { encrypt, safeDecrypt } from "../lib/crypto"

const guestTagEnum = z.enum(["REGULAR", "VIP", "CORPORATE", "BLACKLIST"])

export const guestRouter = router({
  /**
   * Find guest by email or create if not exists.
   * Upsert behavior: if email already in DB, returns existing guest without overwriting their data.
   */
  findOrCreate: staffProcedure
    .input(
      z.object({
        email: z.string().email(),
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        phone: z.string().max(30).optional(),
        nationality: z.string().max(3).optional(),
        idNumber: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { idNumber, email, firstName, lastName, phone, nationality } = input

      const existing = await ctx.db.guest.findUnique({ where: { email } })

      if (existing) {
        const { idNumberEnc, ...rest } = existing
        return {
          ...rest,
          idNumber: idNumberEnc ? safeDecrypt(idNumberEnc) : null,
          isNew: false,
        }
      }

      const idNumberEnc = idNumber ? encrypt(idNumber) : undefined

      const guest = await ctx.db.guest.create({
        data: { email, firstName, lastName, phone, nationality, idNumberEnc },
      })

      const { idNumberEnc: enc, ...rest } = guest
      return {
        ...rest,
        idNumber: enc ? safeDecrypt(enc) : null,
        isNew: true,
      }
    }),

  /**
   * Full-text search on name, email, phone (max 20 results).
   * idNumber is NOT searchable (encrypted at rest).
   */
  search: staffProcedure
    .input(z.object({ query: z.string().min(2).max(100) }))
    .query(async ({ ctx, input }) => {
      const guests = await ctx.db.guest.findMany({
        where: {
          isActive: true,
          OR: [
            { email: { contains: input.query, mode: "insensitive" } },
            { firstName: { contains: input.query, mode: "insensitive" } },
            { lastName: { contains: input.query, mode: "insensitive" } },
            { phone: { contains: input.query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          nationality: true,
          tag: true,
          language: true,
          createdAt: true,
          _count: { select: { bookings: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        take: 20,
      })
      return guests
    }),

  /**
   * Returns full guest profile + last 10 bookings + internal notes (non-deleted).
   * idNumber is decrypted before returning.
   */
  getProfile: staffProcedure
    .input(z.object({ guestId: z.string() }))
    .query(async ({ ctx, input }) => {
      const guest = await ctx.db.guest.findFirst({
        where: { id: input.guestId, isActive: true },
        include: {
          notes: {
            where: { isDeleted: false },
            include: {
              author: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          bookings: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              confirmationCode: true,
              status: true,
              channel: true,
              checkInDate: true,
              checkOutDate: true,
              totalNights: true,
              roomType: { select: { id: true, name: true, slug: true } },
              rooms: {
                select: { room: { select: { number: true, floor: true } } },
                take: 1,
              },
            },
          },
        },
      })

      if (!guest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Guest not found" })
      }

      const { idNumberEnc, ...rest } = guest
      return {
        ...rest,
        idNumber: idNumberEnc ? safeDecrypt(idNumberEnc) : null,
      }
    }),

  /**
   * Update guest contact info and/or tag.
   * idNumber is encrypted before saving if provided.
   */
  update: staffProcedure
    .input(
      z.object({
        guestId: z.string(),
        firstName: z.string().min(1).max(100).optional(),
        lastName: z.string().min(1).max(100).optional(),
        phone: z.string().max(30).nullish(),
        nationality: z.string().max(3).nullish(),
        idNumber: z.string().max(50).nullish(),
        tag: guestTagEnum.optional(),
        language: z.string().max(5).optional(),
        dateOfBirth: z.string().date("Invalid date").nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { guestId, idNumber, dateOfBirth, ...data } = input

      const guest = await ctx.db.guest.findFirst({
        where: { id: guestId, isActive: true },
      })
      if (!guest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Guest not found" })
      }

      const idNumberEnc =
        idNumber === undefined
          ? undefined
          : idNumber === null
            ? null
            : encrypt(idNumber)

      const updated = await ctx.db.guest.update({
        where: { id: guestId },
        data: {
          ...data,
          ...(idNumberEnc !== undefined && { idNumberEnc }),
          ...(dateOfBirth !== undefined && {
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth + "T00:00:00.000Z") : null,
          }),
        },
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Guest",
          entityId: guestId,
          action: "UPDATE",
          changes: JSON.parse(
            JSON.stringify({
              ...data,
              ...(idNumber !== undefined && { idNumberUpdated: true }),
            })
          ),
        },
      })

      const { idNumberEnc: enc, ...rest } = updated
      return {
        ...rest,
        idNumber: enc ? safeDecrypt(enc) : null,
      }
    }),

  /**
   * Add an internal note to a guest profile.
   * Notes are staff-only and include author + timestamp.
   */
  addNote: staffProcedure
    .input(
      z.object({
        guestId: z.string(),
        content: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const guest = await ctx.db.guest.findFirst({
        where: { id: input.guestId, isActive: true },
      })
      if (!guest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Guest not found" })
      }

      return ctx.db.guestNote.create({
        data: {
          guestId: input.guestId,
          content: input.content,
          authorId: ctx.auth.staffId,
        },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
        },
      })
    }),

  /**
   * Soft-delete a guest note. Manager / Admin only.
   */
  deleteNote: staffProcedure
    .input(z.object({ noteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!["MANAGER", "ADMIN"].includes(ctx.auth.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only Managers can delete notes" })
      }

      const note = await ctx.db.guestNote.findFirst({
        where: { id: input.noteId, isDeleted: false },
        select: { id: true },
      })
      if (!note) throw new TRPCError({ code: "NOT_FOUND", message: "Note not found" })

      await ctx.db.guestNote.update({
        where: { id: input.noteId },
        data: { isDeleted: true, deletedAt: new Date() },
      })

      return { noteId: input.noteId }
    }),
})

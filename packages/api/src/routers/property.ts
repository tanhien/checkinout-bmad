import { z } from "zod"
import { TRPCError } from "@trpc/server"
import Handlebars from "handlebars"
import { router, staffProcedure, adminProcedure, publicProcedure } from "../trpc"

// Sample data for email template preview
const EMAIL_PREVIEW_DATA = {
  guestName: "Nguyễn Văn An",
  confirmationCode: "HTL-2025-DEMO01",
  checkIn: "15/07/2025",
  checkOut: "18/07/2025",
  roomType: "Deluxe Double",
  propertyName: "Grand Hotel",
  propertyAddress: "123 Lê Lợi, Quận 1, TP.HCM",
  qrCodeImage: "",
}

const DEFAULT_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="vi">
<body style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#1d4ed8">{{propertyName}} — Đặt phòng thành công!</h2>
  <p>Kính gửi {{guestName}},</p>
  <p>Chúng tôi đã nhận được đặt phòng của bạn.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;font-weight:600;width:40%">Mã xác nhận</td><td style="padding:8px">{{confirmationCode}}</td></tr>
    <tr style="background:#f3f4f6"><td style="padding:8px;font-weight:600">Phòng</td><td style="padding:8px">{{roomType}}</td></tr>
    <tr><td style="padding:8px;font-weight:600">Nhận phòng</td><td style="padding:8px">{{checkIn}}</td></tr>
    <tr style="background:#f3f4f6"><td style="padding:8px;font-weight:600">Trả phòng</td><td style="padding:8px">{{checkOut}}</td></tr>
  </table>
  {{#if qrCodeImage}}<img src="{{qrCodeImage}}" alt="QR Code" style="width:150px" />{{/if}}
  <p>Cảm ơn bạn đã đặt phòng!</p>
  <p style="color:#6b7280;font-size:12px">{{propertyName}} · {{propertyAddress}}</p>
</body>
</html>`

export const propertyRouter = router({
  // Get current property config — used by staff dashboard, kiosk, and booking portal
  getConfig: staffProcedure.query(async ({ ctx }) => {
    if (!ctx.propertyId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
    }
    const property = await ctx.db.property.findUnique({
      where: { id: ctx.propertyId },
      select: {
        id: true,
        name: true,
        type: true,
        address: true,
        phone: true,
        email: true,
        logoUrl: true,
        tagline: true,
        description: true,
        checkInHour: true,
        checkOutHour: true,
        timezone: true,
        currency: true,
        wifiPassword: true,
        breakfastHours: true,
        childMaxAge: true,
        freeCancelHours: true,
        walkinMaxDays: true,
        maxAdvanceDays: true,
        minStayNights: true,
        emailTemplate: true,
        taxCode: true,
        bankAccount: true,
      },
    })
    if (!property) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" })
    }
    return property
  }),

  // Get public property info for booking portal (no auth required)
  getPublicInfo: publicProcedure.query(async ({ ctx }) => {
    const property = await ctx.db.property.findFirst({
      select: {
        id: true,
        name: true,
        type: true,
        address: true,
        phone: true,
        email: true,
        logoUrl: true,
        tagline: true,
        description: true,
        checkInHour: true,
        checkOutHour: true,
        timezone: true,
        currency: true,
        breakfastHours: true,
        childMaxAge: true,
        freeCancelHours: true,
        maxAdvanceDays: true,
        minStayNights: true,
      },
    })
    if (!property) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Property not configured" })
    }
    return property
  }),

  // Update property config — admin only
  update: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        type: z
          .enum(["BOUTIQUE", "BUSINESS", "RESORT", "HOSTEL", "SERVICED_APARTMENT", "MOTEL"])
          .optional(),
        address: z.string().min(1).optional(),
        phone: z.string().min(1).optional(),
        email: z.string().email().optional(),
        tagline: z.string().max(200).nullish(),
        description: z.string().nullish(),
        checkInHour: z.number().int().min(0).max(23).optional(),
        checkOutHour: z.number().int().min(0).max(23).optional(),
        timezone: z.string().optional(),
        currency: z.string().length(3).optional(),
        walkinMaxDays: z.number().int().min(0).optional(),
        maxAdvanceDays: z.number().int().min(1).optional(),
        minStayNights: z.number().int().min(1).optional(),
        freeCancelHours: z.number().int().min(0).nullish(),
        childMaxAge: z.number().int().min(0).optional(),
        wifiPassword: z.string().nullish(),
        breakfastHours: z.string().nullish(),
        emailTemplate: z.string().nullish(),
        taxCode: z.string().nullish(),
        bankAccount: z.string().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }
      const property = await ctx.db.property.update({
        where: { id: ctx.propertyId },
        data: input,
      })
      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Property",
          entityId: property.id,
          action: "UPDATE",
          changes: JSON.parse(JSON.stringify(input)),
        },
      })
      return property
    }),

  // Preview email template with sample data (E6-S1)
  previewEmailTemplate: adminProcedure
    .input(z.object({ template: z.string() }))
    .mutation(({ input }) => {
      try {
        const compiled = Handlebars.compile(input.template)
        const html = compiled(EMAIL_PREVIEW_DATA)
        return { html }
      } catch (err: unknown) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Template error: ${err instanceof Error ? err.message : "Invalid template"}`,
        })
      }
    }),

  // Get default email template (E6-S1)
  getDefaultEmailTemplate: adminProcedure.query(() => {
    return { template: DEFAULT_EMAIL_TEMPLATE }
  }),
})

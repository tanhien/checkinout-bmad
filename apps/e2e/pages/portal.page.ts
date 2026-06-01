import { type Page, expect } from "@playwright/test"

const URL = process.env["PORTAL_URL"] ?? "http://localhost:3000"

export class PortalLoginPage {
  constructor(private page: Page) {}

  async goto(locale = "vi") {
    await this.page.goto(`${URL}/${locale}/login`)
    await expect(this.page.locator("form")).toBeVisible()
  }

  async login(email: string, password: string) {
    await this.page.fill('[type="email"]', email)
    await this.page.fill('[type="password"]', password)
    await this.page.click('[type="submit"]')
  }

  async loginExpectSuccess(email: string, password: string) {
    await this.login(email, password)
    await expect(this.page).toHaveURL(/my-bookings/, { timeout: 10_000 })
  }
}

export class PortalRoomsPage {
  constructor(private page: Page) {}

  async goto(locale = "vi") {
    await this.page.goto(`${URL}/${locale}/rooms`)
    await expect(this.page.locator("main")).toBeVisible()
  }

  async selectFirstRoom() {
    await this.page.locator('a:has-text("Đặt ngay"), a:has-text("Book now"), button:has-text("Đặt")').first().click()
  }
}

export class PortalBookingFunnel {
  constructor(private page: Page) {}

  /** Navigate directly to the booking page with query params */
  async goto(roomTypeId: string, checkin: string, checkout: string, locale = "vi") {
    await this.page.goto(
      `${URL}/${locale}/book?roomTypeId=${roomTypeId}&checkin=${checkin}&checkout=${checkout}&adults=2`,
    )
    await expect(this.page.locator("main")).toBeVisible()
  }

  async nextStep() {
    await this.page.locator('button:has-text("Tiếp"), button:has-text("Next"), button:has-text("Tiếp theo")').click()
  }

  async fillGuestInfo(info: { firstName: string; lastName: string; email: string; phone?: string }) {
    // Step 2: guest info
    const lastField = this.page.locator('[name="lastName"], [placeholder*="họ" i]').first()
    if (await lastField.isVisible()) await lastField.fill(info.lastName)
    const firstField = this.page.locator('[name="firstName"], [placeholder*="tên" i]').first()
    if (await firstField.isVisible()) await firstField.fill(info.firstName)
    await this.page.fill('[type="email"]', info.email)
    if (info.phone) {
      const phoneField = this.page.locator('[type="tel"]').first()
      if (await phoneField.isVisible()) await phoneField.fill(info.phone)
    }
  }

  async agreeAndNext() {
    const checkbox = this.page.locator('[type="checkbox"]').first()
    if (await checkbox.isVisible() && !(await checkbox.isChecked())) {
      await checkbox.check()
    }
    await this.nextStep()
  }

  async confirm() {
    await this.page.locator('button:has-text("Xác nhận"), button:has-text("Confirm")').last().click()
  }

  async getConfirmationCode(): Promise<string> {
    // Wait for confirmation page
    await expect(this.page).toHaveURL(/\/booking\/HTL-/, { timeout: 15_000 })
    const match = this.page.url().match(/HTL-\d{4}-[A-Z0-9]{6}/)
    return match?.[0] ?? ""
  }
}

export class PortalMyBookingsPage {
  constructor(private page: Page) {}

  async goto(locale = "vi") {
    await this.page.goto(`${URL}/${locale}/my-bookings`)
    await expect(this.page.locator("main")).toBeVisible()
  }

  async getBookingCount(tab: "upcoming" | "past" | "cancelled") {
    const tabBtn = this.page.locator(`button:has-text("${tab === "upcoming" ? "Sắp tới" : tab === "past" ? "Đã lưu trú" : "Đã hủy"}")`)
    const text = await tabBtn.textContent()
    const match = text?.match(/\((\d+)\)/)
    return match ? parseInt(match[1]!) : 0
  }

  async confirmationCodesOnTab(): Promise<string[]> {
    const codes = await this.page.locator('text=/HTL-\\d{4}-[A-Z0-9]{6}/').allTextContents()
    return codes
  }
}

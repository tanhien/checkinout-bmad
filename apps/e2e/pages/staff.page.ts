import { type Page, expect } from "@playwright/test"

const URL = process.env["STAFF_URL"] ?? "http://localhost:3001"

export class StaffLoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${URL}/login`)
    await expect(this.page.locator("form")).toBeVisible()
  }

  async login(email: string, password: string) {
    await this.page.fill('[type="email"]', email)
    await this.page.fill('[type="password"]', password)
    await this.page.click('[type="submit"]')
  }

  async loginExpectSuccess(email: string, password: string) {
    await this.login(email, password)
    await expect(this.page).toHaveURL(/\/(dashboard|bookings|housekeeping)/, { timeout: 10_000 })
  }

  async loginExpectError(email: string, password: string) {
    await this.login(email, password)
    await expect(this.page.locator("text=/không đúng|invalid|error/i")).toBeVisible({ timeout: 5_000 })
  }
}

export class StaffDashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${URL}/dashboard`)
  }

  sidebar() {
    return this.page.locator("nav, aside").first()
  }

  async hasSidebarLink(label: RegExp | string) {
    return this.sidebar().locator(`text=${label}`).isVisible()
  }
}

export class StaffBookingsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${URL}/bookings`)
    await expect(this.page.locator("h1, h2").first()).toBeVisible()
  }

  async openBooking(code: string) {
    await this.page.goto(`${URL}/bookings`)
    await this.page.fill('[placeholder*="tìm" i], [placeholder*="search" i], input[type="search"]', code)
    await this.page.keyboard.press("Enter")
    await this.page.locator(`text=${code}`).first().click()
    await expect(this.page).toHaveURL(/\/bookings\//, { timeout: 8_000 })
  }

  async checkIn() {
    await this.page.locator('button:has-text("Check-in"), button:has-text("Nhận phòng")').first().click()
    await this.page.locator('button:has-text("Xác nhận"), button:has-text("Confirm")').click()
  }

  async checkOut() {
    await this.page.locator('button:has-text("Check-out"), button:has-text("Trả phòng")').first().click()
    await this.page.locator('button:has-text("Xác nhận"), button:has-text("Confirm")').click()
  }

  async cancel(reason = "E2E test cancel") {
    await this.page.locator('button:has-text("Hủy"), button:has-text("Cancel")').first().click()
    const reasonInput = this.page.locator('textarea, input[placeholder*="lý do" i]')
    if (await reasonInput.isVisible()) await reasonInput.fill(reason)
    await this.page.locator('button:has-text("Xác nhận"), button:has-text("Confirm")').last().click()
  }
}

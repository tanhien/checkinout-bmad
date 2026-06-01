import { type Page, expect } from "@playwright/test"

const URL = process.env["KIOSK_URL"] ?? "http://localhost:3002"

export class KioskHomePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(URL)
    await expect(this.page.locator("text=/Check-in|Nhận phòng/i")).toBeVisible({ timeout: 10_000 })
  }

  async clickCheckIn() {
    await this.page.locator('button:has-text("Check-in"), button:has-text("Nhận phòng")').first().click()
  }

  async clickCheckOut() {
    await this.page.locator('button:has-text("Check-out"), button:has-text("Trả phòng")').first().click()
  }

  async clickCallStaff() {
    await this.page.locator('button:has-text("Gọi nhân viên"), button:has-text("Call Staff")').first().click()
  }
}

export class KioskCheckInFlow {
  constructor(private page: Page) {}

  async enterCode(code: string) {
    const input = this.page.locator('input[type="text"], input[placeholder*="mã" i]').first()
    await input.fill(code)
    await this.page.locator('button:has-text("Tìm"), button:has-text("Search"), button:has-text("Tiếp")').first().click()
  }

  async confirmBooking() {
    await this.page.locator('button:has-text("Đúng"), button:has-text("Xác nhận"), button:has-text("Tiếp tục")').first().click()
  }

  async enterName(name: string) {
    const input = this.page.locator('input[type="text"]').first()
    await input.clear()
    await input.fill(name)
    await this.page.locator('button:has-text("Xác nhận"), button:has-text("Confirm"), button:has-text("Tiếp")').first().click()
  }

  async expectSuccess() {
    await expect(
      this.page.locator('text=/Chào mừng|Phòng|Thành công|Welcome|Room/i'),
    ).toBeVisible({ timeout: 15_000 })
  }

  async expectNameMismatch() {
    await expect(
      this.page.locator('text=/không khớp|mismatch|sai tên/i'),
    ).toBeVisible({ timeout: 8_000 })
  }

  async expectTooEarly() {
    await expect(
      this.page.locator('text=/sớm|early|chưa đến/i'),
    ).toBeVisible({ timeout: 8_000 })
  }

  async expectNoRoom() {
    await expect(
      this.page.locator('text=/không có phòng|no room|hết phòng/i'),
    ).toBeVisible({ timeout: 8_000 })
  }
}

export class KioskCheckOutFlow {
  constructor(private page: Page) {}

  async enterCode(code: string) {
    const input = this.page.locator('input[type="text"], input[placeholder*="mã" i]').first()
    await input.fill(code)
    await this.page.locator('button:has-text("Tìm"), button:has-text("Search"), button:has-text("Tiếp")').first().click()
  }

  async confirmCheckOut() {
    await this.page.locator('button:has-text("Xác nhận"), button:has-text("Trả phòng"), button:has-text("Confirm")').first().click()
  }

  async expectSuccess() {
    await expect(
      this.page.locator('text=/Cảm ơn|Thank|Thành công/i'),
    ).toBeVisible({ timeout: 15_000 })
  }
}

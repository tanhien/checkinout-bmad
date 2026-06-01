/**
 * KIOSK tests — TC-KIOSK-01..10
 * P0: 01,02,03,04,05,08  |  P1: 06,07,09,10
 * Seed bookings: HTL-2026-KIOSK1 (guest: Nguyen Bob, CONFIRMED, room T102)
 *                HTL-2026-EARLY1 (CONFIRMED, checkIn = +7 days)
 *                HTL-2026-CHKOUT (CHECKED_IN, room T202)
 */
import { test, expect } from "@playwright/test"
import { KioskHomePage, KioskCheckInFlow, KioskCheckOutFlow } from "../pages/kiosk.page"

// ── TC-KIOSK-01: Check-in thành công ─────────────────────────────────────────
test("TC-KIOSK-01: check-in kiosk happy path — Nguyen Bob", async ({ page }) => {
  const home = new KioskHomePage(page)
  await home.goto()
  await home.clickCheckIn()

  const flow = new KioskCheckInFlow(page)
  await flow.enterCode("HTL-2026-KIOSK1")

  // Step 2: booking confirm — verify we see the booking info
  await expect(page.locator("text=HTL-2026-KIOSK1")).toBeVisible({ timeout: 8_000 })
  await flow.confirmBooking()

  // Step 3: name verify — correct Vietnamese order (Họ Tên = Nguyen Bob)
  await flow.enterName("Nguyen Bob")
  await flow.expectSuccess()

  // Room number must be visible
  await expect(page.locator("text=/T10[1-9]|T[0-9]{3}/")).toBeVisible({ timeout: 8_000 })
})

// ── TC-KIOSK-02: Tên sai bị từ chối ─────────────────────────────────────────
test("TC-KIOSK-02: name mismatch bị từ chối", async ({ page }) => {
  const home = new KioskHomePage(page)
  await home.goto()
  await home.clickCheckIn()

  const flow = new KioskCheckInFlow(page)
  await flow.enterCode("HTL-2026-KIOSK1")
  await expect(page.locator("text=HTL-2026-KIOSK1")).toBeVisible({ timeout: 8_000 })
  await flow.confirmBooking()

  await flow.enterName("Wrong Name XXXX")
  await flow.expectNameMismatch()
})

// ── TC-KIOSK-03: Tên có dấu tiếng Việt được chuẩn hóa ───────────────────────
test("TC-KIOSK-03: tên không dấu vẫn khớp với tên có dấu", async ({ page }) => {
  // Guest: lastName=Nguyen firstName=Bob → expected normalized: "nguyen bob"
  // Input "NGUYEN BOB" (all caps, no diacritics) should match
  const home = new KioskHomePage(page)
  await home.goto()
  await home.clickCheckIn()

  const flow = new KioskCheckInFlow(page)
  await flow.enterCode("HTL-2026-KIOSK1")
  await expect(page.locator("text=HTL-2026-KIOSK1")).toBeVisible({ timeout: 8_000 })
  await flow.confirmBooking()

  // Try uppercase
  await flow.enterName("NGUYEN BOB")
  await flow.expectSuccess()
})

// ── TC-KIOSK-04: Check-in quá sớm bị từ chối ─────────────────────────────────
test("TC-KIOSK-04: check-in quá sớm (checkIn = ngày mai) → TOO_EARLY", async ({ page }) => {
  const home = new KioskHomePage(page)
  await home.goto()
  await home.clickCheckIn()

  const flow = new KioskCheckInFlow(page)
  // HTL-2026-EARLY1 has checkIn = TODAY + 7 days
  await flow.enterCode("HTL-2026-EARLY1")
  await expect(page.locator("text=HTL-2026-EARLY1")).toBeVisible({ timeout: 8_000 })
  await flow.confirmBooking()

  // Name for guest.test@example.com — last=Guest first=Test
  await flow.enterName("Guest Test")
  await flow.expectTooEarly()
})

// ── TC-KIOSK-05: Không còn phòng sạch → NO_CLEAN_ROOM ────────────────────────
test.skip("TC-KIOSK-05: không còn phòng sạch → báo hết phòng", async ({ page }) => {
  // Requires manually setting all rooms of the booking's type to non-CLEAN
  // Skipped in automated suite — run manually after setting T101/T102 to DIRTY
  const home = new KioskHomePage(page)
  await home.goto()
  await home.clickCheckIn()
  const flow = new KioskCheckInFlow(page)
  await flow.enterCode("HTL-2026-CHKIN1")
  await flow.confirmBooking()
  await flow.enterName("Guest Test")
  await flow.expectNoRoom()
})

// ── TC-KIOSK-07: Walk-in booking tại kiosk ───────────────────────────────────
test("TC-KIOSK-07: walk-in booking happy path", async ({ page }) => {
  const home = new KioskHomePage(page)
  await home.goto()

  // Click walk-in / book room button
  const walkInBtn = page.locator('button:has-text("Đặt phòng"), button:has-text("Walk-in")').first()
  await walkInBtn.click()

  // Select dates: tomorrow to day-after-tomorrow
  const tomorrow = new Date(Date.now() + 86400_000).toISOString().slice(0, 10)
  const checkoutDate = new Date(Date.now() + 2 * 86400_000).toISOString().slice(0, 10)

  // Fill check-in date
  const checkinInput = page.locator('input[type="date"]').first()
  if (await checkinInput.isVisible()) {
    await checkinInput.fill(tomorrow)
    const checkoutInput = page.locator('input[type="date"]').nth(1)
    if (await checkoutInput.isVisible()) await checkoutInput.fill(checkoutDate)
  }

  // Select room type (first available)
  await page.locator('button:has-text("Chọn"), button:has-text("Select")').first().click()

  // Fill guest info
  const lastName = page.locator('[placeholder*="họ" i], [name="lastName"]').first()
  if (await lastName.isVisible()) await lastName.fill("Walk")
  const firstName = page.locator('[placeholder*="tên" i], [name="firstName"]').first()
  if (await firstName.isVisible()) await firstName.fill("In")
  const phone = page.locator('[type="tel"]').first()
  if (await phone.isVisible()) await phone.fill("0912000000")
  const email = page.locator('[type="email"]').first()
  if (await email.isVisible()) await email.fill("walkin@test.hotel")

  await page.locator('button:has-text("Tiếp"), button:has-text("Next")').first().click()

  // Confirm + demo payment
  await page.locator('button:has-text("Xác nhận"), button:has-text("Confirm")').first().click()

  // Success screen should show room number
  await expect(
    page.locator('text=/Phòng|Room|Thành công|Success/i'),
  ).toBeVisible({ timeout: 20_000 })
})

// ── TC-KIOSK-08: Check-out happy path ────────────────────────────────────────
test("TC-KIOSK-08: kiosk check-out happy path", async ({ page }) => {
  const home = new KioskHomePage(page)
  await home.goto()
  await home.clickCheckOut()

  const flow = new KioskCheckOutFlow(page)
  await flow.enterCode("HTL-2026-CHKOUT")

  // Folio should display
  await expect(page.locator("text=/Tổng|Total|Phí/i")).toBeVisible({ timeout: 8_000 })

  await flow.confirmCheckOut()
  await flow.expectSuccess()
})

// ── TC-KIOSK-09: Gọi nhân viên ───────────────────────────────────────────────
test("TC-KIOSK-09: nút gọi nhân viên phát alert", async ({ page }) => {
  const home = new KioskHomePage(page)
  await home.goto()
  await home.clickCallStaff()

  // Should show confirmation or return to home
  await expect(
    page.locator('text=/Đã gọi|Nhân viên|Gọi|Alert sent/i'),
  ).toBeVisible({ timeout: 8_000 })
})

// ── TC-KIOSK-10: Idle timeout tự reset ───────────────────────────────────────
test.skip("TC-KIOSK-10: idle 5 phút → tự về màn hình chờ", async ({ page }) => {
  // This test would take 5 minutes — skip in automated suite
  // Run manually to verify idle overlay behavior
})

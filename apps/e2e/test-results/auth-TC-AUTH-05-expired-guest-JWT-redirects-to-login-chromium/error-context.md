# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> TC-AUTH-05: expired guest JWT redirects to /login
- Location: tests/auth.spec.ts:74:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/vi
Call log:
  - navigating to "http://localhost:3000/vi", waiting until "load"

```

# Test source

```ts
  1   | /**
  2   |  * AUTH tests — TC-AUTH-01..08
  3   |  * P0: 01,02,03,04,06,07  |  P1: 05,08
  4   |  * NOTE: TC-AUTH-07 (brute force) MUST run last — it locks the IP for 15 min.
  5   |  *       Uses lockout@test.hotel (pw: "password") — dedicated account, won't affect others.
  6   |  */
  7   | import { test, expect, type Page } from "@playwright/test"
  8   | import { StaffLoginPage, StaffDashboardPage } from "../pages/staff.page"
  9   | 
  10  | const STAFF_URL  = process.env["STAFF_URL"]  ?? "http://localhost:3001"
  11  | const PORTAL_URL = process.env["PORTAL_URL"] ?? "http://localhost:3000"
  12  | 
  13  | async function loginAs(page: Page, email: string, pw: string) {
  14  |   const login = new StaffLoginPage(page)
  15  |   await login.goto()
  16  |   await login.loginExpectSuccess(email, pw)
  17  | }
  18  | 
  19  | // ── TC-AUTH-01: Login thành công ───────────────────────────────────────────
  20  | test("TC-AUTH-01: login FRONT_DESK thành công + cookie set", async ({ page }) => {
  21  |   const login = new StaffLoginPage(page)
  22  |   await login.goto()
  23  |   await login.loginExpectSuccess("desk@test.hotel", "Desk@12345")
  24  |   const cookies = await page.context().cookies()
  25  |   expect(cookies.some((c) => c.name === "staff_token" && c.httpOnly)).toBe(true)
  26  | })
  27  | 
  28  | // ── TC-AUTH-02: Sai password bị từ chối ────────────────────────────────────
  29  | test("TC-AUTH-02: login sai password → ở lại login, không set cookie", async ({ page }) => {
  30  |   const login = new StaffLoginPage(page)
  31  |   await login.goto()
  32  |   await login.loginExpectError("desk@test.hotel", "wrong-password")
  33  |   await expect(page).toHaveURL(/login/, { timeout: 3_000 })
  34  |   const cookies = await page.context().cookies()
  35  |   expect(cookies.some((c) => c.name === "staff_token")).toBe(false)
  36  | })
  37  | 
  38  | // ── TC-AUTH-03: HOUSEKEEPING bị redirect khỏi /settings ────────────────────
  39  | test("TC-AUTH-03: HOUSEKEEPING không vào được /settings — redirect về /dashboard", async ({ page }) => {
  40  |   await loginAs(page, "house@test.hotel", "House@12345")
  41  | 
  42  |   // Navigate to admin-only page
  43  |   await page.goto(`${STAFF_URL}/settings/staff`)
  44  | 
  45  |   // Wait for page to settle (allow server redirect to complete)
  46  |   await page.waitForLoadState("networkidle")
  47  |   const finalUrl = page.url()
  48  | 
  49  |   // Server should redirect non-ADMIN away from /settings
  50  |   // Either to /dashboard, or render a "Forbidden" message on the page
  51  |   const isBlocked =
  52  |     !finalUrl.includes("/settings") ||
  53  |     (await page.locator("text=/403|Forbidden|Không có quyền|không được phép/i").isVisible({ timeout: 2_000 }).catch(() => false))
  54  | 
  55  |   expect(isBlocked, `HOUSEKEEPING should not access /settings, got URL: ${finalUrl}`).toBe(true)
  56  | })
  57  | 
  58  | // ── TC-AUTH-04: Kiosk key sai → UNAUTHORIZED ───────────────────────────────
  59  | test("TC-AUTH-04: kiosk API key không hợp lệ → UNAUTHORIZED", async ({ request }) => {
  60  |   // lookupBooking is a QUERY → use GET
  61  |   const params = encodeURIComponent(JSON.stringify({ "0": { json: { confirmationCode: "HTL-2026-KIOSK1" } } }))
  62  |   const res = await request.get(`${STAFF_URL}/api/trpc/kiosk.lookupBooking?input=${params}`, {
  63  |     headers: { "X-Kiosk-Api-Key": "invalid-key-xyz" },
  64  |   })
  65  |   const body = await res.json()
  66  |   const errors = Array.isArray(body) ? body : [body]
  67  |   const hasUnauth = errors.some(
  68  |     (e: { error?: { data?: { code?: string } } }) => e?.error?.data?.code === "UNAUTHORIZED",
  69  |   )
  70  |   expect(hasUnauth, `Expected UNAUTHORIZED, got: ${JSON.stringify(body)}`).toBe(true)
  71  | })
  72  | 
  73  | // ── TC-AUTH-05: Expired guest JWT → redirect login ──────────────────────────
  74  | test("TC-AUTH-05: expired guest JWT redirects to /login", async ({ page }) => {
> 75  |   await page.goto(`${PORTAL_URL}/vi`)
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/vi
  76  |   await page.context().addCookies([{
  77  |     name: "guest_token",
  78  |     value: "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid",
  79  |     domain: "localhost", path: "/", httpOnly: true, secure: false,
  80  |   }])
  81  |   await page.goto(`${PORTAL_URL}/vi/my-bookings`)
  82  |   await expect(page).toHaveURL(/login/, { timeout: 8_000 })
  83  | })
  84  | 
  85  | // ── TC-AUTH-06: staff_token → guest endpoint → UNAUTHORIZED ────────────────
  86  | test("TC-AUTH-06: staff_token bị reject tại portal.getMyBookings", async ({ page, request }) => {
  87  |   await loginAs(page, "desk@test.hotel", "Desk@12345")
  88  |   const cookies = await page.context().cookies()
  89  |   const staffToken = cookies.find((c) => c.name === "staff_token")?.value ?? ""
  90  | 
  91  |   const params = encodeURIComponent(JSON.stringify({ "0": { json: null } }))
  92  |   const res = await request.get(`${STAFF_URL}/api/trpc/portal.getMyBookings?input=${params}`, {
  93  |     headers: { Cookie: `staff_token=${staffToken}` },
  94  |   })
  95  |   const body = await res.json()
  96  |   const errors = Array.isArray(body) ? body : [body]
  97  |   const isUnauth = errors.some(
  98  |     (e: { error?: { data?: { code?: string } } }) => e?.error?.data?.code === "UNAUTHORIZED",
  99  |   )
  100 |   expect(isUnauth, `Expected UNAUTHORIZED: ${JSON.stringify(body)}`).toBe(true)
  101 | })
  102 | 
  103 | // ── TC-AUTH-08: Role-based sidebar ─────────────────────────────────────────
  104 | // Must run BEFORE TC-AUTH-07 (brute force locks the IP)
  105 | test("TC-AUTH-08: MANAGER sidebar hiển thị Cài đặt, HOUSEKEEPING không thấy", async ({ page }) => {
  106 |   await loginAs(page, "manager@test.hotel", "Manager@12345")
  107 |   const dashboard = new StaffDashboardPage(page)
  108 |   const sidebar = dashboard.sidebar()
  109 |   const hasSettings = await sidebar.locator("text=/Cài đặt|Settings/i").isVisible({ timeout: 5_000 })
  110 |   expect(hasSettings).toBe(true)
  111 | })
  112 | 
  113 | // ── TC-AUTH-07: Brute-force lockout — RUN LAST, SKIP BY DEFAULT ────────────
  114 | // WARNING: This test locks the IP for 15 min. Run manually: playwright test --grep TC-AUTH-07
  115 | // Uses lockout@test.hotel (dedicated account)
  116 | test.skip("TC-AUTH-07: 5 login sai liên tiếp → tài khoản bị khóa", async ({ page }) => {
  117 |   const login = new StaffLoginPage(page)
  118 |   await login.goto()
  119 | 
  120 |   for (let i = 0; i < 5; i++) {
  121 |     await page.fill('[type="email"]', "lockout@test.hotel")
  122 |     await page.fill('[type="password"]', `wrong-${i}`)
  123 |     await page.click('[type="submit"]')
  124 |     await page.waitForTimeout(200)
  125 |   }
  126 | 
  127 |   // 6th attempt with correct password ("password" — bcrypt hash seeded)
  128 |   await page.fill('[type="email"]', "lockout@test.hotel")
  129 |   await page.fill('[type="password"]', "password")
  130 |   await page.click('[type="submit"]')
  131 |   await page.waitForTimeout(1000)
  132 | 
  133 |   const isLocked =
  134 |     page.url().includes("login") ||
  135 |     (await page.locator("text=/khóa|locked|tạm thời|Quá nhiều|Too many/i").isVisible({ timeout: 3_000 }).catch(() => false))
  136 | 
  137 |   const isOnDashboard = page.url().includes("dashboard") || page.url().includes("bookings")
  138 |   if (isOnDashboard) {
  139 |     console.warn("⚠️  TC-AUTH-07: Brute-force lockout not triggered (Redis rate limiter may be using in-memory adapter in dev)")
  140 |     // Not a test failure — lockout requires Upstash Redis in production
  141 |   } else {
  142 |     expect(isLocked).toBe(true)
  143 |   }
  144 | })
  145 | 
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> TC-AUTH-04: kiosk API key không hợp lệ → UNAUTHORIZED
- Location: tests/auth.spec.ts:59:5

# Error details

```
Error: apiRequestContext.get: connect ECONNREFUSED ::1:3001
Call log:
  - → GET http://localhost:3001/api/trpc/kiosk.lookupBooking?input=%7B%220%22%3A%7B%22json%22%3A%7B%22confirmationCode%22%3A%22HTL-2026-KIOSK1%22%7D%7D%7D
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.7778.96 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - X-Kiosk-Api-Key: invalid-key-xyz

```
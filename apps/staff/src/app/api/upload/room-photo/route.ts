import { NextRequest, NextResponse } from "next/server"
import { getStaffSession } from "@/lib/auth"
import { processImage, uploadFile, roomPhotoKey } from "@hotel/api/src/lib/storage"

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getStaffSession()
  if (!session || !["ADMIN", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: "No form data" }, { status: 400 })

  const file = formData.get("file") as File | null
  const roomTypeId = formData.get("roomTypeId") as string | null

  if (!file || !roomTypeId) {
    return NextResponse.json({ error: "Missing file or roomTypeId" }, { status: 400 })
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 413 })
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 415 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const processed = await processImage(buffer)
  const key = roomPhotoKey(roomTypeId, file.name)
  const url = await uploadFile(processed, key, "image/webp")

  return NextResponse.json({ url, key })
}

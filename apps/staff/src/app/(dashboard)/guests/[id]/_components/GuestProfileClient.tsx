"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateGuestAction, addGuestNoteAction, deleteGuestNoteAction } from "../../actions"

type Guest = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  nationality: string | null
  dateOfBirth: string | null
  tag: string
  language: string
}

type Note = {
  id: string
  content: string
  createdAt: string
  author: { id: string; firstName: string; lastName: string }
}

const TAG_OPTIONS = [
  { value: "REGULAR",   label: "Thường"    },
  { value: "VIP",       label: "VIP"       },
  { value: "CORPORATE", label: "Corporate" },
  { value: "BLACKLIST", label: "Blacklist" },
]

const TAG_BADGE: Record<string, string> = {
  VIP:       "bg-yellow-100 text-yellow-800",
  BLACKLIST: "bg-red-100 text-red-800",
  CORPORATE: "bg-blue-100 text-blue-800",
  REGULAR:   "bg-gray-100 text-gray-600",
}
const TAG_LABEL: Record<string, string> = {
  VIP: "VIP", BLACKLIST: "Blacklist", CORPORATE: "Corporate", REGULAR: "Thường",
}

function fmtDateTime(iso: string): string {
  return iso.slice(0, 16).replace("T", " ") + " UTC"
}

export function GuestProfileClient({
  guest,
  notes,
  isManager,
}: {
  guest: Guest
  notes: Note[]
  isManager: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editFirst, setEditFirst] = useState(guest.firstName)
  const [editLast, setEditLast] = useState(guest.lastName)
  const [editPhone, setEditPhone] = useState(guest.phone ?? "")
  const [editNationality, setEditNationality] = useState(guest.nationality ?? "")
  const [editDob, setEditDob] = useState(guest.dateOfBirth?.slice(0, 10) ?? "")
  const [editTag, setEditTag] = useState(guest.tag)
  const [editError, setEditError] = useState("")

  // Note state
  const [noteInput, setNoteInput] = useState("")
  const [noteError, setNoteError] = useState("")

  function handleEditOpen() {
    setEditFirst(guest.firstName)
    setEditLast(guest.lastName)
    setEditPhone(guest.phone ?? "")
    setEditNationality(guest.nationality ?? "")
    setEditDob(guest.dateOfBirth?.slice(0, 10) ?? "")
    setEditTag(guest.tag)
    setEditError("")
    setIsEditing(true)
  }

  function handleEditSave() {
    if (!editFirst.trim() || !editLast.trim()) {
      setEditError("Họ và tên không được để trống")
      return
    }
    setEditError("")
    startTransition(async () => {
      try {
        await updateGuestAction(guest.id, {
          firstName: editFirst.trim(),
          lastName: editLast.trim(),
          phone: editPhone.trim() || null,
          nationality: editNationality.trim() || null,
          dateOfBirth: editDob || null,
          ...(isManager && { tag: editTag as "REGULAR" | "VIP" | "CORPORATE" | "BLACKLIST" }),
        })
        setIsEditing(false)
        router.refresh()
      } catch (e) {
        setEditError(e instanceof Error ? e.message : "Lỗi khi lưu thay đổi")
      }
    })
  }

  function handleAddNote() {
    if (!noteInput.trim()) return
    setNoteError("")
    startTransition(async () => {
      try {
        await addGuestNoteAction(guest.id, noteInput.trim())
        setNoteInput("")
        router.refresh()
      } catch (e) {
        setNoteError(e instanceof Error ? e.message : "Lỗi khi thêm ghi chú")
      }
    })
  }

  function handleDeleteNote(noteId: string) {
    startTransition(async () => {
      try {
        await deleteGuestNoteAction(guest.id, noteId)
        router.refresh()
      } catch {
        // silently ignore — UI will not change if server rejects
      }
    })
  }

  // Notes displayed oldest-first (API returns newest-first)
  const orderedNotes = [...notes].reverse()

  return (
    <div className="space-y-6">
      {/* Contact info card */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Thông tin liên hệ</h2>
          {!isEditing && (
            <button
              onClick={handleEditOpen}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Chỉnh sửa
            </button>
          )}
        </div>

        {!isEditing ? (
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-gray-400">Họ tên</dt>
              <dd className="text-gray-900 font-medium">
                {guest.firstName} {guest.lastName}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-gray-400">Email</dt>
              <dd className="text-gray-700">{guest.email}</dd>
            </div>
            {guest.phone && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-gray-400">Điện thoại</dt>
                <dd className="text-gray-700">{guest.phone}</dd>
              </div>
            )}
            {guest.nationality && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-gray-400">Quốc tịch</dt>
                <dd className="text-gray-700">{guest.nationality}</dd>
              </div>
            )}
            {guest.dateOfBirth && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-gray-400">Ngày sinh</dt>
                <dd className="text-gray-700">{guest.dateOfBirth.slice(0, 10)}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-gray-400">Phân loại</dt>
              <dd>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TAG_BADGE[guest.tag] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {TAG_LABEL[guest.tag] ?? guest.tag}
                </span>
              </dd>
            </div>
          </dl>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tên</label>
                <input
                  value={editFirst}
                  onChange={(e) => setEditFirst(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Họ</label>
                <input
                  value={editLast}
                  onChange={(e) => setEditLast(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Điện thoại</label>
              <input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Tùy chọn"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quốc tịch (mã ISO)</label>
                <input
                  value={editNationality}
                  onChange={(e) => setEditNationality(e.target.value.slice(0, 3).toUpperCase())}
                  placeholder="VN, US..."
                  maxLength={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ngày sinh</label>
                <input
                  type="date"
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            {isManager && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phân loại khách</label>
                <select
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {TAG_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}
            {editError && (
              <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">{editError}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleEditSave}
                disabled={isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={isPending}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notes section */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Ghi chú nội bộ</h2>

        {/* Add note form */}
        <div className="mb-4 space-y-2">
          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Thêm ghi chú về khách..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
          />
          {noteError && <p className="text-xs text-red-600">{noteError}</p>}
          <button
            onClick={handleAddNote}
            disabled={!noteInput.trim() || isPending}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
          >
            {isPending ? "Đang lưu..." : "Thêm ghi chú"}
          </button>
        </div>

        {/* Notes list — oldest first (chronological) */}
        {orderedNotes.length === 0 ? (
          <p className="text-sm text-gray-400">Chưa có ghi chú nào</p>
        ) : (
          <ol className="space-y-3">
            {orderedNotes.map((note) => (
              <li
                key={note.id}
                className="rounded-lg bg-gray-50 px-4 py-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="flex-1 text-gray-800 whitespace-pre-wrap">{note.content}</p>
                  {isManager && (
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={isPending}
                      title="Xóa ghi chú"
                      className="shrink-0 rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    >
                      🗑
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-gray-400">
                  {note.author.firstName} {note.author.lastName} · {fmtDateTime(note.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

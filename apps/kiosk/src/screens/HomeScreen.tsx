import { useApp } from "@/context/AppContext"
import { useT } from "@/lib/i18n"
import { KioskButton } from "@/components/KioskButton"

export function HomeScreen() {
  const { lang, goTo, property } = useApp()
  const t = useT(lang)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 py-12">
      {/* Property branding */}
      <div className="mb-12 text-center">
        {property?.logoUrl ? (
          <img src={property.logoUrl} alt={property.name} className="mb-4 h-16 w-auto object-contain" />
        ) : (
          <div className="mb-4 text-7xl">🏨</div>
        )}
        <h1 className="text-4xl font-bold text-white">
          {property?.name ?? t("home.title")}
        </h1>
        <p className="mt-2 text-xl text-blue-200">{t("home.subtitle")}</p>
      </div>

      {/* 3 main action buttons */}
      <div className="flex w-full max-w-2xl flex-col gap-5">
        <KioskButton
          variant="primary"
          size="xl"
          fullWidth
          icon="🔑"
          onClick={() => goTo("check-in")}
          className="bg-blue-600 shadow-lg shadow-blue-900/40 hover:bg-blue-500"
        >
          {t("home.btn.checkin")}
        </KioskButton>

        <KioskButton
          variant="secondary"
          size="xl"
          fullWidth
          icon="📅"
          onClick={() => goTo("walk-in")}
          className="bg-white/15 border-white/30 text-white hover:bg-white/25 backdrop-blur"
        >
          {t("home.btn.walkin")}
        </KioskButton>

        <KioskButton
          variant="secondary"
          size="xl"
          fullWidth
          icon="🚪"
          onClick={() => goTo("check-out")}
          className="bg-white/15 border-white/30 text-white hover:bg-white/25 backdrop-blur"
        >
          {t("home.btn.checkout")}
        </KioskButton>
      </div>

      {/* Property info strip */}
      {property && (
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-blue-200">
          {property.checkInHour !== undefined && (
            <span>Check-in: {property.checkInHour}:00</span>
          )}
          {property.checkOutHour !== undefined && (
            <span>Check-out: {property.checkOutHour}:00</span>
          )}
          {property.phone && <span>📞 {property.phone}</span>}
        </div>
      )}
    </div>
  )
}

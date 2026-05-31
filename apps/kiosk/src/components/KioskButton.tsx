import type { ButtonHTMLAttributes, ReactNode } from "react"

type Variant = "primary" | "secondary" | "danger" | "ghost" | "success"

const VARIANTS: Record<Variant, string> = {
  primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
  secondary: "bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-900 border-2 border-gray-300",
  danger: "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white",
  ghost: "bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-700",
  success: "bg-green-600 hover:bg-green-700 active:bg-green-800 text-white",
}

interface KioskButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: "sm" | "md" | "lg" | "xl"
  icon?: ReactNode
  fullWidth?: boolean
}

const SIZES: Record<string, string> = {
  sm: "px-5 py-3 text-base min-h-[48px]",
  md: "px-6 py-4 text-lg min-h-[60px]",
  lg: "px-8 py-5 text-xl min-h-[72px]",
  xl: "px-10 py-6 text-2xl min-h-[88px]",
}

export function KioskButton({
  variant = "primary",
  size = "lg",
  icon,
  fullWidth = false,
  className = "",
  children,
  disabled,
  ...rest
}: KioskButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-3 rounded-2xl font-semibold transition-all duration-150 select-none",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      disabled={disabled}
      {...rest}
    >
      {icon && <span className="shrink-0 text-[1.25em]">{icon}</span>}
      {children}
    </button>
  )
}

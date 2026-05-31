import { type HTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../utils"

const skeletonVariants = cva("animate-pulse bg-gray-200", {
  variants: {
    variant: {
      rectangular: "rounded-md",
      text: "rounded h-4 w-full",
      circular: "rounded-full",
    },
  },
  defaultVariants: {
    variant: "rectangular",
  },
})

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return <div className={cn(skeletonVariants({ variant }), className)} {...props} />
}

export { Skeleton }

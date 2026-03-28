"use client"

import { cn } from "@/lib/utils"

interface MenuToggleIconProps {
  isOpen: boolean
  className?: string
}

export function MenuToggleIcon({ isOpen, className }: MenuToggleIconProps) {
  return (
    <div
      className={cn("relative flex h-5 w-5 flex-col items-center justify-center gap-[5px]", className)}
      aria-hidden="true"
    >
      <span
        className={cn(
          "block h-px w-5 origin-center rounded-full bg-current transition-all duration-300 ease-in-out",
          isOpen ? "translate-y-[7px] rotate-45" : ""
        )}
      />
      <span
        className={cn(
          "block h-px w-5 rounded-full bg-current transition-all duration-300 ease-in-out",
          isOpen ? "opacity-0 scale-x-0" : ""
        )}
      />
      <span
        className={cn(
          "block h-px w-5 origin-center rounded-full bg-current transition-all duration-300 ease-in-out",
          isOpen ? "-translate-y-[7px] -rotate-45" : ""
        )}
      />
    </div>
  )
}

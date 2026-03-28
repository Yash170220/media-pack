"use client"

import { useRef, useState, CSSProperties } from "react"
import { cn } from "@/lib/utils"

interface StarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  duration?: number
  starCount?: number
  starColor?: string
  className?: string
}

interface Star {
  id: number
  x: number
  y: number
  size: number
  angle: number
  speed: number
  opacity: number
  life: number
}

export function StarButton({
  children,
  duration = 1.5,
  starCount = 8,
  starColor = "#D4AF37",
  className,
  onClick,
  ...props
}: StarButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [stars, setStars] = useState<Star[]>([])
  const raf = useRef<number>(0)

  const spawnStars = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = btnRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top

    const newStars: Star[] = Array.from({ length: starCount }, (_, i) => ({
      id: Date.now() + i,
      x: cx,
      y: cy,
      size: Math.random() * 6 + 4,
      angle: (Math.PI * 2 * i) / starCount + (Math.random() - 0.5) * 0.5,
      speed: Math.random() * 60 + 40,
      opacity: 1,
      life: 1,
    }))

    setStars((prev) => [...prev, ...newStars])

    const start = performance.now()
    const dur = duration * 1000

    const tick = (now: number) => {
      const elapsed = now - start
      const t = elapsed / dur

      if (t >= 1) {
        setStars((prev) => prev.filter((s) => !newStars.find((n) => n.id === s.id)))
        return
      }

      setStars((prev) =>
        prev.map((s) => {
          const match = newStars.find((n) => n.id === s.id)
          if (!match) return s
          return {
            ...s,
            x: match.x + Math.cos(match.angle) * match.speed * t * 1.5,
            y: match.y + Math.sin(match.angle) * match.speed * t * 1.5,
            opacity: 1 - t,
            life: 1 - t,
          }
        })
      )

      raf.current = requestAnimationFrame(tick)
    }

    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(tick)

    onClick?.(e)
  }

  return (
    <button
      ref={btnRef}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 overflow-visible rounded-xl",
        "bg-gradient-to-br from-[var(--terra,#E89C7F)] to-[var(--coral,#FF9B85)]",
        "px-7 py-3 text-sm font-semibold text-white shadow-md",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        "active:translate-y-0 active:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--terra,#E89C7F)] focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      style={{ "--duration": duration } as CSSProperties}
      onClick={spawnStars}
      {...props}
    >
      {children}

      {/* Stars portal rendered inside button for clip-free positioning */}
      {stars.map((star) => (
        <span
          key={star.id}
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            left: star.x,
            top: star.y,
            opacity: star.opacity,
            transform: `translate(-50%, -50%) scale(${star.life})`,
            willChange: "transform, opacity",
          }}
        >
          <svg
            width={star.size}
            height={star.size}
            viewBox="0 0 16 16"
            fill={starColor}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 0 L9.5 6 L16 8 L9.5 10 L8 16 L6.5 10 L0 8 L6.5 6 Z" />
          </svg>
        </span>
      ))}
    </button>
  )
}

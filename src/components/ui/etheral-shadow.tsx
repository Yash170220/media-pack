"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface EtherealShadowProps {
  className?: string
  color?: string
  blur?: number
  opacity?: number
  size?: number
  animate?: boolean
}

export function EtherealShadow({
  className,
  color = "rgba(232,156,127,0.35)",
  blur = 120,
  opacity = 1,
  size = 600,
  animate = true,
}: EtherealShadowProps) {
  const ref = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: 50, y: 50 })
  const current = useRef({ x: 50, y: 50 })
  const raf = useRef<number>(0)

  useEffect(() => {
    if (!animate) return

    const onMove = (e: MouseEvent | TouchEvent) => {
      const el = ref.current?.parentElement
      if (!el) return
      const rect = el.getBoundingClientRect()
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
      pos.current.x = ((clientX - rect.left) / rect.width) * 100
      pos.current.y = ((clientY - rect.top) / rect.height) * 100
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    window.addEventListener("touchmove", onMove, { passive: true })

    const loop = () => {
      current.current.x += (pos.current.x - current.current.x) * 0.05
      current.current.y += (pos.current.y - current.current.y) * 0.05
      if (ref.current) {
        ref.current.style.left = `${current.current.x}%`
        ref.current.style.top = `${current.current.y}%`
      }
      raf.current = requestAnimationFrame(loop)
    }

    raf.current = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("touchmove", onMove)
      cancelAnimationFrame(raf.current)
    }
  }, [animate])

  return (
    <div
      ref={ref}
      className={cn("pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: color,
        filter: `blur(${blur}px)`,
        opacity,
        left: "50%",
        top: "50%",
        willChange: "left, top",
      }}
      aria-hidden="true"
    />
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

// Finance & marketing themed imagery
const IMAGES = [
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&q=80", // stock market charts
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&q=80", // analytics laptop
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&q=80", // data analytics dashboard
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&q=80", // businessman suit
  "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=300&q=80", // marketing analytics
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&q=80", // finance city skyline
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=300&q=80", // modern office
  "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=300&q=80", // digital marketing
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=300&q=80", // startup team
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80", // professional woman
  "https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=300&q=80", // finance money
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&q=80", // laptop analytics
  "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=300&q=80", // luxury brand
  "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=300&q=80", // brand strategy board
  "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300&q=80", // social media marketing
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&q=80", // content team
  "https://images.unsplash.com/photo-1520333789090-1afc82db536a?w=300&q=80", // professional meeting
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=300&q=80", // finance charts
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=300&q=80", // business meeting
  "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=300&q=80", // digital marketing desk
]

interface GridImage {
  id: number
  src: string
  x: number
  y: number
  width: number
  height: number
  opacity: number
  scale: number
  rotation: number
}

function generateGrid(count: number): GridImage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    src: IMAGES[i % IMAGES.length],
    x: Math.random() * 80 + 10,
    y: Math.random() * 80 + 10,
    width: Math.random() * 140 + 100,
    height: Math.random() * 90 + 70,
    opacity: Math.random() * 0.45 + 0.25,
    scale: Math.random() * 0.35 + 0.85,
    rotation: (Math.random() - 0.5) * 14,
  }))
}

interface IntroAnimationProps {
  className?: string
  imageCount?: number
  style?: React.CSSProperties
  children?: React.ReactNode
}

export function IntroAnimation({ className, imageCount = 20, style, children }: IntroAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [images, setImages] = useState<GridImage[]>([])
  const [scrollProgress, setScrollProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setImages(generateGrid(imageCount))
    setLoaded(true)

    const handleScroll = () => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const windowH = window.innerHeight
      const progress = Math.max(0, Math.min(1, -rect.top / (rect.height - windowH)))
      setScrollProgress(progress)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [imageCount])

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      style={{ height: "300vh", ...style }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Warm cream background */}
        <div
          className="absolute inset-0"
          style={{ background: "var(--bg, #FEFEF8)" }}
        />

        {/* Subtle gold grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(212,175,55,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,.04) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Scattered finance/marketing images */}
        <div className="absolute inset-0">
          {images.map((img) => {
            const translateY =
              scrollProgress * -150 *
              (img.id % 3 === 0 ? 1.5 : img.id % 3 === 1 ? 0.7 : 1.2)
            const scale =
              img.scale + scrollProgress * 0.12 * (img.id % 2 === 0 ? 1 : -0.5)
            const currentOpacity = loaded
              ? Math.max(0, img.opacity - scrollProgress * img.opacity * 1.4)
              : 0

            return (
              <div
                key={img.id}
                className="absolute overflow-hidden"
                style={{
                  left: `${img.x}%`,
                  top: `${img.y}%`,
                  width: img.width,
                  height: img.height,
                  opacity: currentOpacity,
                  transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale}) rotate(${img.rotation}deg)`,
                  transition: "opacity 0.5s ease",
                  willChange: "transform, opacity",
                  borderRadius: 10,
                  boxShadow: "0 6px 24px rgba(62,39,35,.12), 0 1px 4px rgba(62,39,35,.08)",
                  border: "1px solid rgba(212,175,55,.18)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {/* Warm tint overlay on images */}
                <div
                  className="absolute inset-0"
                  style={{ background: "rgba(212,175,55,.06)", mixBlendMode: "multiply" }}
                />
              </div>
            )
          })}
        </div>

        {/* Center content — fades in as images scatter away */}
        {children && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            style={{ opacity: Math.min(1, scrollProgress * 2.5), pointerEvents: scrollProgress > 0.2 ? "auto" : "none" }}
          >
            {children}
          </div>
        )}

        {/* Radial vignette — warms the edges */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, transparent 25%, rgba(254,254,248,${0.15 + scrollProgress * 0.8}) 100%)`,
          }}
        />

        {/* Top/bottom fade bands */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{ background: "linear-gradient(to bottom, var(--bg, #FEFEF8), transparent)" }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
          style={{ background: "linear-gradient(to top, var(--bg, #FEFEF8), transparent)" }}
        />
      </div>
    </div>
  )
}

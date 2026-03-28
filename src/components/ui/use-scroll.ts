"use client"

import { useEffect, useState } from "react"

interface ScrollState {
  scrollY: number
  scrollDirection: "up" | "down" | null
  isAtTop: boolean
  isScrolled: boolean
}

export function useScroll(threshold = 10): ScrollState {
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollY: 0,
    scrollDirection: null,
    isAtTop: true,
    isScrolled: false,
  })

  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const direction = currentScrollY > lastScrollY ? "down" : "up"

      setScrollState({
        scrollY: currentScrollY,
        scrollDirection: Math.abs(currentScrollY - lastScrollY) > threshold ? direction : null,
        isAtTop: currentScrollY < threshold,
        isScrolled: currentScrollY > threshold,
      })

      lastScrollY = currentScrollY
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [threshold])

  return scrollState
}

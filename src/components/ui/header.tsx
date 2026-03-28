"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { signIn, signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { MenuToggleIcon } from "./menu-toggle-icon"
import { useScroll } from "./use-scroll"
import { MarkentineLogoIcon } from "@/components/markentine-logo-mark"

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#create" },
  { label: "Pricing", href: "#pricing" },
  { label: "Brand DNA", href: "/brand" },
]

export function Header() {
  const { data: session, status } = useSession()
  const isSignedIn = status === "authenticated"
  const isLoaded = status !== "loading"
  const { isScrolled } = useScroll(8)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false) }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  return (
    <>
      <header
        className={cn(
          "fixed left-0 right-0 top-0 z-[200] transition-all duration-300",
          isScrolled
            ? "border-b border-[rgba(212,175,55,.1)] bg-[rgba(6,8,15,.88)] shadow-lg backdrop-blur-xl"
            : "bg-transparent"
        )}
        style={{ height: 66 }}
      >
        <div className="mx-auto flex h-full max-w-[1180px] items-center justify-between px-6 md:px-8">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            onClick={() => setMobileOpen(false)}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-[10px] shadow-md"
              style={{ background: "linear-gradient(135deg,#D4AF37 0%,#B87333 100%)" }}
              title="Markentine"
            >
              <MarkentineLogoIcon />
            </div>
            <span
              style={{
                fontFamily: "'Roboto', sans-serif",
                fontSize: 21,
                fontWeight: 600,
                color: "#fff",
                letterSpacing: ".04em",
              }}
            >
              Markentine
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[13px] font-medium text-[rgba(255,255,255,.65)] transition-colors hover:text-white"
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop auth actions */}
          <div className="hidden items-center gap-3 md:flex">
            {!isLoaded && (
              <div className="h-8 w-24 animate-pulse rounded-lg bg-white/10" />
            )}

            {isLoaded && isSignedIn && (
              <>
                {session?.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "avatar"}
                    className="h-8 w-8 rounded-full object-cover"
                    style={{ border: "1.5px solid rgba(212,175,55,.4)" }}
                  />
                )}
                <span
                  className="text-xs text-[rgba(255,255,255,.5)]"
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  {session.user?.name?.split(" ")[0] ?? session.user?.email?.split("@")[0]}
                </span>
                <Link
                  href="/brand"
                  className="rounded-lg px-4 py-1.5 text-xs font-semibold text-[#D4AF37] transition-colors hover:text-white"
                  style={{
                    fontFamily: "'Roboto', sans-serif",
                    border: "1px solid rgba(212,175,55,.3)",
                  }}
                >
                  Brand DNA
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-xs text-[rgba(255,255,255,.35)] transition-colors hover:text-white"
                  style={{ fontFamily: "'Roboto', sans-serif", background: "none", border: "none", cursor: "pointer" }}
                >
                  Sign out
                </button>
              </>
            )}

            {isLoaded && !isSignedIn && (
              <>
                <button
                  onClick={() => signIn("google", { callbackUrl: "/" })}
                  className="text-[13px] font-medium text-[rgba(255,255,255,.6)] transition-colors hover:text-white"
                  style={{ fontFamily: "'Roboto', sans-serif", background: "none", border: "none", cursor: "pointer" }}
                >
                  Log in
                </button>
                <button
                  onClick={() => signIn("google", { callbackUrl: "/" })}
                  className="rounded-lg px-5 py-2 text-[13px] font-bold text-[#06080F] shadow-md transition-all hover:-translate-y-px hover:shadow-lg"
                  style={{
                    background: "linear-gradient(135deg,#D4AF37,#B87333)",
                    fontFamily: "'Roboto', sans-serif",
                    border: "none",
                    cursor: "pointer",
                    letterSpacing: ".02em",
                  }}
                >
                  Get started →
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <MenuToggleIcon isOpen={mobileOpen} />
          </button>
        </div>
      </header>

      {/* Mobile menu drawer */}
      <div
        className={cn(
          "fixed inset-0 z-[199] flex flex-col bg-[#06080F] transition-all duration-300 md:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{ paddingTop: 66 }}
        aria-hidden={!mobileOpen}
      >
        <nav className="flex flex-col gap-1 p-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-4 py-3.5 text-[15px] font-medium text-[rgba(255,255,255,.75)] transition-colors hover:bg-white/5 hover:text-white"
              style={{ fontFamily: "'Roboto', sans-serif" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 p-6">
          {isLoaded && isSignedIn ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {session?.user?.image && (
                  <img src={session.user.image} alt="" className="h-9 w-9 rounded-full" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">{session?.user?.name}</p>
                  <p className="text-xs text-white/40">{session?.user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }) }}
                className="mt-2 w-full rounded-lg border border-white/10 py-2.5 text-sm text-white/50 transition-colors hover:border-white/20 hover:text-white"
                style={{ background: "none", cursor: "pointer" }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setMobileOpen(false); signIn("google", { callbackUrl: "/" }) }}
                className="w-full rounded-xl py-3 text-center text-[15px] font-bold text-[#06080F]"
                style={{ background: "linear-gradient(135deg,#D4AF37,#B87333)", border: "none", cursor: "pointer" }}
              >
                Get started →
              </button>
              <button
                onClick={() => { setMobileOpen(false); signIn("google", { callbackUrl: "/" }) }}
                className="w-full rounded-xl border border-white/15 py-3 text-[15px] text-white/70 transition-colors hover:text-white"
                style={{ background: "none", cursor: "pointer" }}
              >
                Log in
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

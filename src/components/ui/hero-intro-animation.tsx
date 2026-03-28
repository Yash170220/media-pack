"use client";

import { MarkentineLogoIcon } from "@/components/markentine-logo-mark";
import React, { useState, useEffect, useRef } from "react";
import { motion, useTransform, useSpring, useMotionValue } from "framer-motion";

type AnimationPhase = "scatter" | "line" | "circle" | "arc";

interface CardTarget {
  x: number; y: number; rotation: number; scale: number; opacity: number;
}

interface FlipCardProps {
  src: string; index: number; target: CardTarget;
}

const IMG_W = 60;
const IMG_H = 85;

function FlipCard({ src, index, target }: FlipCardProps) {
  return (
    <motion.div
      animate={{ x: target.x, y: target.y, rotate: target.rotation, scale: target.scale, opacity: target.opacity }}
      transition={{ type: "spring", stiffness: 40, damping: 15 }}
      style={{ position: "absolute", width: IMG_W, height: IMG_H, transformStyle: "preserve-3d", perspective: "1000px" }}
      className="cursor-pointer group"
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ rotateY: 180 }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 h-full w-full overflow-hidden rounded-xl"
          style={{ backfaceVisibility: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,.6)", border: "1px solid rgba(212,175,55,.2)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`card-${index}`} className="h-full w-full object-cover" />
          <div className="absolute inset-0 group-hover:bg-transparent transition-colors" style={{ background: "rgba(6,8,15,.35)" }} />
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 h-full w-full overflow-hidden rounded-xl flex flex-col items-center justify-center"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "#06080F", border: "1px solid rgba(212,175,55,.4)" }}
        >
          <div style={{ width: 18, height: 18, borderRadius: 5, background: "linear-gradient(135deg,#D4AF37,#B87333)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
            <MarkentineLogoIcon size={11} />
          </div>
          <p style={{ fontSize: 7, fontWeight: 700, color: "rgba(212,175,55,.8)", letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "Roboto, sans-serif" }}>Markentine</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

const IMAGES = [
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&q=80",
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&q=80",
  "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=300&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=300&q=80",
  "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=300&q=80",
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=300&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80",
  "https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=300&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&q=80",
  "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=300&q=80",
  "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=300&q=80",
  "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&q=80",
  "https://images.unsplash.com/photo-1520333789090-1afc82db536a?w=300&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=300&q=80",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=300&q=80",
  "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=300&q=80",
];

const TOTAL = 20;
const MAX_SCROLL = 3000;
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

/** Hero footer stats — title case for labels */
const HERO_STATS: [string, string][] = [
  ["4 Min", "Per Pack"],
  ["4 Platforms", "Publish"],
  ["100%", "Verified"],
  ["3.4K", "Packs"],
];

interface HeroIntroAnimationProps {
  isSignedIn?: boolean;
  onSignIn?: () => void;
}

export function HeroIntroAnimation({ isSignedIn, onSignIn }: HeroIntroAnimationProps) {
  // ─── ALL hooks declared unconditionally at the top ──────────────────────
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<AnimationPhase>("scatter");
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [scatter, setScatter] = useState<CardTarget[]>([]);
  const [morphV, setMorphV] = useState(0);
  const [rotV, setRotV] = useState(0);
  const [paraV, setParaV] = useState(0);

  const virtualScroll = useMotionValue(0);
  const scrollRef = useRef(0);
  const mouseX = useMotionValue(0);
  const morphRaw = useTransform(virtualScroll, [0, 600], [0, 1]);
  const morph = useSpring(morphRaw, { stiffness: 40, damping: 20 });
  const rotateRaw = useTransform(virtualScroll, [600, 3000], [0, 360]);
  const rotate = useSpring(rotateRaw, { stiffness: 40, damping: 20 });
  const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 });
  const contentOpacity = useTransform(morph, [0.8, 1], [0, 1]);
  const contentY = useTransform(morph, [0.8, 1], [20, 0]);
  const scrollHintOpacity = useTransform(morph, [0, 0.3], [1, 0]);

  // Mount flag — must be after all hook declarations
  useEffect(() => { setMounted(true); }, []);

  // Resize observer
  useEffect(() => {
    if (!mounted) return;
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    setSize({ w: el.offsetWidth, h: el.offsetHeight });
    return () => ro.disconnect();
  }, [mounted]);

  // Client-only scatter positions
  useEffect(() => {
    if (!mounted) return;
    setScatter(IMAGES.map(() => ({
      x: (Math.random() - 0.5) * 1400,
      y: (Math.random() - 0.5) * 900,
      rotation: (Math.random() - 0.5) * 180,
      scale: 0.5,
      opacity: 0,
    })));
  }, [mounted]);

  // Intro sequence
  useEffect(() => {
    if (!mounted) return;
    const t1 = setTimeout(() => setPhase("line"), 400);
    const t2 = setTimeout(() => setPhase("circle"), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [mounted]);

  // Virtual scroll (wheel + touch)
  useEffect(() => {
    if (!mounted) return;
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const v = Math.min(Math.max(scrollRef.current + e.deltaY, 0), MAX_SCROLL);
      scrollRef.current = v;
      virtualScroll.set(v);
    };
    let ty = 0;
    const onTouchStart = (e: TouchEvent) => { ty = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      const dy = ty - e.touches[0].clientY;
      ty = e.touches[0].clientY;
      const v = Math.min(Math.max(scrollRef.current + dy, 0), MAX_SCROLL);
      scrollRef.current = v;
      virtualScroll.set(v);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [mounted, virtualScroll]);

  // Mouse parallax
  useEffect(() => {
    if (!mounted) return;
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mouseX.set(((e.clientX - r.left) / r.width * 2 - 1) * 80);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [mounted, mouseX]);

  // Subscribe to motion values
  useEffect(() => {
    if (!mounted) return;
    const u1 = morph.on("change", setMorphV);
    const u2 = rotate.on("change", setRotV);
    const u3 = smoothMouseX.on("change", setParaV);
    return () => { u1(); u2(); u3(); };
  }, [mounted, morph, rotate, smoothMouseX]);

  // ─── Conditional render AFTER all hooks ─────────────────────────────────
  if (!mounted) {
    return (
      <div style={{ height: "100vh", background: "#06080F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(212,175,55,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,.04) 1px,transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 500, background: "radial-gradient(ellipse,rgba(212,175,55,.06) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ textAlign: "center", padding: "0 28px", position: "relative", zIndex: 2, maxWidth: 640 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(212,175,55,.55)", fontFamily: "Roboto, sans-serif", marginBottom: 20 }}>Agence de Contenu IA · Paris</p>
          <h1 style={{ fontFamily: "Roboto, sans-serif", fontSize: "clamp(36px,5vw,72px)", fontWeight: 300, color: "#FEFEF8", lineHeight: 1.15, marginBottom: 28 }}>
            Get your profits in line with{" "}
            <span style={{ color: "#D4AF37", fontWeight: 700 }}>Markentine.</span>
          </h1>
          <p style={{ fontSize: 15, color: "rgba(254,254,248,.5)", lineHeight: 1.8, fontFamily: "Roboto, sans-serif", marginBottom: 32, maxWidth: 460, margin: "0 auto 32px" }}>
            Markentine transforms raw headlines into verified story specs, cinematic carousels, and platform-native copy — in about four minutes.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
            {isSignedIn
              ? <a href="#create" style={{ display: "inline-flex", alignItems: "center", background: "linear-gradient(135deg,#D4AF37,#B87333)", color: "#06080F", fontSize: 14, fontWeight: 700, padding: "14px 32px", borderRadius: 4, textDecoration: "none", fontFamily: "Roboto, sans-serif", letterSpacing: ".04em" }}>Create a pack →</a>
              : <button onClick={onSignIn} style={{ display: "inline-flex", alignItems: "center", background: "linear-gradient(135deg,#D4AF37,#B87333)", color: "#06080F", fontSize: 14, fontWeight: 700, padding: "14px 32px", borderRadius: 4, border: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif", letterSpacing: ".04em" }}>Start free →</button>
            }
            <a href="/broadcast" style={{ display: "inline-flex", alignItems: "center", background: "transparent", border: "1px solid rgba(212,175,55,.3)", color: "rgba(254,254,248,.65)", fontSize: 14, padding: "14px 24px", borderRadius: 4, textDecoration: "none", fontFamily: "Roboto, sans-serif" }}>Go Live →</a>
          </div>
          <div style={{ display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap", borderTop: "1px solid rgba(212,175,55,.1)", paddingTop: 24 }}>
            {HERO_STATS.map(([n, l]) => (
              <div key={n} style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "Roboto, sans-serif", fontSize: 26, fontWeight: 700, color: "#D4AF37", lineHeight: 1 }}>{n}</p>
                <p style={{ fontSize: 10, color: "rgba(254,254,248,.3)", fontFamily: "Roboto, sans-serif", marginTop: 4, letterSpacing: ".04em" }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Full animated hero (client only) ───────────────────────────────────
  return (
    <div ref={containerRef} className="relative w-full overflow-hidden" style={{ height: "100vh", background: "#06080F" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(212,175,55,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,.04) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 500, background: "radial-gradient(ellipse,rgba(212,175,55,.06) 0%,transparent 70%)", pointerEvents: "none" }} />

      <div className="flex h-full w-full flex-col items-center justify-center" style={{ perspective: 1000 }}>

        {/* Intro label — fades out as morph progresses */}
        <div className="absolute z-0 flex flex-col items-center justify-center text-center pointer-events-none" style={{ top: "50%", transform: "translateY(-50%)" }}>
          <motion.h1
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={phase === "circle" && morphV < 0.5
              ? { opacity: 1 - morphV * 2, y: 0, filter: "blur(0px)" }
              : { opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 1 }}
            style={{ fontFamily: "Roboto, sans-serif", fontSize: "clamp(30px,4.5vw,62px)", fontWeight: 300, color: "#FEFEF8", lineHeight: 1.12 }}
          >
            Get your profits in line with<br />
            <span style={{ color: "#D4AF37", fontWeight: 700 }}>Markentine.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={phase === "circle" && morphV < 0.5 ? { opacity: 0.5 - morphV } : { opacity: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            style={{ marginTop: 14, fontSize: 10, fontWeight: 700, letterSpacing: ".2em", color: "rgba(212,175,55,.5)", fontFamily: "Roboto, sans-serif", textTransform: "uppercase" }}
          >
            Scroll inside to explore
          </motion.p>
        </div>

        {/* Arc content — fades in after morph completes */}
        <motion.div
          style={{ opacity: contentOpacity, y: contentY, position: "absolute", top: "6%", zIndex: 10, textAlign: "center", padding: "0 28px", width: "100%", maxWidth: 620, left: "50%", x: "-50%", pointerEvents: morphV > 0.85 ? "auto" : "none" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 14 }}>
            <div style={{ height: 1, width: 32, background: "linear-gradient(90deg,transparent,rgba(212,175,55,.55))" }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(212,175,55,.55)", fontFamily: "Roboto, sans-serif" }}>Agence de Contenu IA · Paris</span>
            <div style={{ height: 1, width: 32, background: "linear-gradient(90deg,rgba(212,175,55,.55),transparent)" }} />
          </div>
          <h2 style={{ fontFamily: "Roboto, sans-serif", fontSize: "clamp(28px,4vw,54px)", fontWeight: 300, color: "#FEFEF8", lineHeight: 1.15, marginBottom: 18 }}>
            Get your profits in line with{" "}
            <span style={{ color: "#D4AF37", fontWeight: 700 }}>Markentine.</span>
          </h2>
          <p style={{ fontSize: 14, color: "rgba(254,254,248,.48)", lineHeight: 1.8, fontFamily: "Roboto, sans-serif", marginBottom: 26, maxWidth: 480, margin: "0 auto 26px" }}>
            Markentine transforms raw headlines into verified story specs, cinematic carousels, and platform-native copy — in about four minutes.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
            {isSignedIn
              ? <a href="#create" style={{ display: "inline-flex", alignItems: "center", background: "linear-gradient(135deg,#D4AF37,#B87333)", color: "#06080F", fontSize: 14, fontWeight: 700, padding: "14px 32px", borderRadius: 4, textDecoration: "none", fontFamily: "Roboto, sans-serif", letterSpacing: ".04em", boxShadow: "0 6px 24px rgba(212,175,55,.3)" }}>Create a pack →</a>
              : <button onClick={onSignIn} style={{ display: "inline-flex", alignItems: "center", background: "linear-gradient(135deg,#D4AF37,#B87333)", color: "#06080F", fontSize: 14, fontWeight: 700, padding: "14px 32px", borderRadius: 4, border: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif", letterSpacing: ".04em", boxShadow: "0 6px 24px rgba(212,175,55,.3)" }}>Start free →</button>
            }
            <a href="/broadcast" style={{ display: "inline-flex", alignItems: "center", background: "transparent", border: "1px solid rgba(212,175,55,.3)", color: "rgba(254,254,248,.65)", fontSize: 14, padding: "14px 24px", borderRadius: 4, textDecoration: "none", fontFamily: "Roboto, sans-serif", fontWeight: 500 }}>Go Live →</a>
          </div>
          <div style={{ display: "flex", gap: 36, justifyContent: "center", flexWrap: "wrap", borderTop: "1px solid rgba(212,175,55,.1)", paddingTop: 20 }}>
            {HERO_STATS.map(([n, l]) => (
              <div key={n} style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "Roboto, sans-serif", fontSize: 24, fontWeight: 700, color: "#D4AF37", lineHeight: 1 }}>{n}</p>
                <p style={{ fontSize: 10, color: "rgba(254,254,248,.3)", fontFamily: "Roboto, sans-serif", marginTop: 3, letterSpacing: ".04em" }}>{l}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Cards */}
        <div className="relative flex items-center justify-center w-full h-full">
          {scatter.length > 0 && IMAGES.slice(0, TOTAL).map((src, i) => {
            let target: CardTarget = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };
            if (phase === "scatter") {
              target = scatter[i] ?? target;
            } else if (phase === "line") {
              const spacing = 70;
              target = { x: i * spacing - (TOTAL * spacing) / 2, y: 0, rotation: 0, scale: 1, opacity: 1 };
            } else {
              const mobile = size.w < 768;
              const minDim = Math.min(size.w, size.h);
              const cRadius = Math.min(minDim * 0.35, 350);
              const cAngle = (i / TOTAL) * 360;
              const cRad = (cAngle * Math.PI) / 180;
              const cPos = { x: Math.cos(cRad) * cRadius, y: Math.sin(cRad) * cRadius, rotation: cAngle + 90 };
              const arcR = Math.min(size.w, size.h * 1.5) * (mobile ? 1.4 : 1.1);
              const apexY = size.h * (mobile ? 0.35 : 0.25);
              const arcCY = apexY + arcR;
              const spread = mobile ? 100 : 130;
              const startA = -90 - spread / 2;
              const step = spread / (TOTAL - 1);
              const scrollProg = Math.min(Math.max(rotV / 360, 0), 1);
              const curA = startA + i * step + (-scrollProg * spread * 0.8);
              const aRad = (curA * Math.PI) / 180;
              const arcPos = { x: Math.cos(aRad) * arcR + paraV, y: Math.sin(aRad) * arcR + arcCY, rotation: curA + 90, scale: mobile ? 1.4 : 1.8 };
              target = {
                x: lerp(cPos.x, arcPos.x, morphV),
                y: lerp(cPos.y, arcPos.y, morphV),
                rotation: lerp(cPos.rotation, arcPos.rotation, morphV),
                scale: lerp(1, arcPos.scale, morphV),
                opacity: 1,
              };
            }
            return <FlipCard key={i} src={src} index={i} target={target} />;
          })}
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        style={{ opacity: scrollHintOpacity, position: "absolute", bottom: 28, left: "50%", x: "-50%", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, pointerEvents: "none" }}
      >
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(212,175,55,.4)", fontFamily: "Roboto, sans-serif" }}>Scroll</span>
        <div style={{ width: 1, height: 32, background: "linear-gradient(180deg,rgba(212,175,55,.4),transparent)" }} />
      </motion.div>
    </div>
  );
}

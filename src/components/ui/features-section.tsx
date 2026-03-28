import { cn } from "@/lib/utils"

interface Feature {
  title: string
  description: string
  graphic: React.ReactNode
}

const features: Feature[] = [
  {
    title: "100% Verified",
    description:
      "Before generating a single image or caption, Markentine cross-references your headline against live web sources via Google Search. You get five verified key facts, source citations, and a strategic \"why it matters\" summary — no hallucinations, no liability.",
    graphic: (
      <svg
        viewBox="0 0 280 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
        aria-hidden="true"
      >
        <rect width="280" height="180" rx="16" fill="#F5EFE6" />
        {/* Document lines */}
        <rect x="40" y="32" width="160" height="8" rx="4" fill="#D4C4B0" />
        <rect x="40" y="52" width="120" height="6" rx="3" fill="#D4C4B0" opacity="0.7" />
        <rect x="40" y="68" width="140" height="6" rx="3" fill="#D4C4B0" opacity="0.5" />
        <rect x="40" y="84" width="100" height="6" rx="3" fill="#D4C4B0" opacity="0.4" />
        {/* Search ring */}
        <circle cx="200" cy="120" r="36" stroke="#E89C7F" strokeWidth="2.5" fill="none" />
        <circle cx="200" cy="120" r="22" fill="rgba(232,156,127,0.12)" />
        {/* Checkmark */}
        <path d="M188 120 L197 130 L215 112" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Magnifier handle */}
        <line x1="228" y1="148" x2="242" y2="162" stroke="#E89C7F" strokeWidth="3" strokeLinecap="round" />
        {/* Source dots */}
        <circle cx="60" cy="130" r="5" fill="#D4AF37" />
        <circle cx="80" cy="130" r="5" fill="#E89C7F" opacity="0.6" />
        <circle cx="100" cy="130" r="5" fill="#D4AF37" opacity="0.4" />
        <rect x="60" y="145" width="80" height="4" rx="2" fill="#D4C4B0" />
      </svg>
    ),
  },
  {
    title: "Instant Generation",
    description:
      "Paste a headline. In about four minutes, Markentine generates a verified story spec, four AI-illustrated Instagram carousel slides, an 8-second cinematic video clip, branded platform posts, and a podcast episode — all running in parallel.",
    graphic: (
      <svg
        viewBox="0 0 280 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
        aria-hidden="true"
      >
        <rect width="280" height="180" rx="16" fill="#F5EFE6" />
        {/* Progress bars */}
        <rect x="40" y="40" width="200" height="10" rx="5" fill="#EDE4D3" />
        <rect x="40" y="40" width="180" height="10" rx="5" fill="#E89C7F" />
        <rect x="40" y="64" width="200" height="10" rx="5" fill="#EDE4D3" />
        <rect x="40" y="64" width="140" height="10" rx="5" fill="#D4AF37" opacity="0.8" />
        <rect x="40" y="88" width="200" height="10" rx="5" fill="#EDE4D3" />
        <rect x="40" y="88" width="100" height="10" rx="5" fill="#E89C7F" opacity="0.7" />
        <rect x="40" y="112" width="200" height="10" rx="5" fill="#EDE4D3" />
        <rect x="40" y="112" width="160" height="10" rx="5" fill="#D4AF37" opacity="0.5" />
        {/* Labels */}
        <rect x="40" y="28" width="52" height="5" rx="2.5" fill="#D4C4B0" />
        <rect x="40" y="52" width="38" height="5" rx="2.5" fill="#D4C4B0" />
        <rect x="40" y="76" width="44" height="5" rx="2.5" fill="#D4C4B0" />
        <rect x="40" y="100" width="48" height="5" rx="2.5" fill="#D4C4B0" />
        {/* Clock */}
        <circle cx="210" cy="148" r="22" stroke="#E89C7F" strokeWidth="2" fill="rgba(232,156,127,0.08)" />
        <line x1="210" y1="148" x2="210" y2="135" stroke="#E89C7F" strokeWidth="2" strokeLinecap="round" />
        <line x1="210" y1="148" x2="220" y2="152" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
        {/* Spark */}
        <path d="M80 148 L72 158 L82 155 L74 168" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    title: "Multi-Platform Ready",
    description:
      "Every pack includes platform-native posts for LinkedIn, Twitter/X, and Instagram with trending hashtags sourced via Google Search at generation time — character-counted, editable, and ready to copy straight into your composer.",
    graphic: (
      <svg
        viewBox="0 0 280 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
        aria-hidden="true"
      >
        <rect width="280" height="180" rx="16" fill="#F5EFE6" />
        {/* LinkedIn card */}
        <rect x="28" y="28" width="68" height="88" rx="8" fill="#0A66C2" opacity="0.15" />
        <rect x="28" y="28" width="68" height="88" rx="8" stroke="#0A66C2" strokeWidth="1.5" fill="none" />
        <rect x="36" y="40" width="52" height="5" rx="2.5" fill="#0A66C2" opacity="0.6" />
        <rect x="36" y="52" width="40" height="4" rx="2" fill="#0A66C2" opacity="0.4" />
        <rect x="36" y="62" width="44" height="4" rx="2" fill="#0A66C2" opacity="0.3" />
        <text x="44" y="100" fontSize="11" fontWeight="700" fill="#0A66C2" fontFamily="sans-serif">in</text>
        {/* X card */}
        <rect x="106" y="28" width="68" height="88" rx="8" fill="#000" opacity="0.08" />
        <rect x="106" y="28" width="68" height="88" rx="8" stroke="#000" strokeWidth="1.5" fill="none" />
        <rect x="114" y="40" width="52" height="5" rx="2.5" fill="#3E2723" opacity="0.4" />
        <rect x="114" y="52" width="36" height="4" rx="2" fill="#3E2723" opacity="0.3" />
        <rect x="114" y="62" width="42" height="4" rx="2" fill="#3E2723" opacity="0.2" />
        <text x="130" y="100" fontSize="12" fontWeight="700" fill="#3E2723" fontFamily="sans-serif">𝕏</text>
        {/* Instagram card */}
        <rect x="184" y="28" width="68" height="88" rx="8" fill="#E89C7F" opacity="0.15" />
        <rect x="184" y="28" width="68" height="88" rx="8" stroke="#E89C7F" strokeWidth="1.5" fill="none" />
        <rect x="192" y="40" width="52" height="5" rx="2.5" fill="#E89C7F" opacity="0.6" />
        <rect x="192" y="52" width="40" height="4" rx="2" fill="#E89C7F" opacity="0.4" />
        <rect x="192" y="62" width="44" height="4" rx="2" fill="#E89C7F" opacity="0.3" />
        {/* Instagram gradient icon */}
        <defs>
          <linearGradient id="igGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="50%" stopColor="#e6683c" />
            <stop offset="100%" stopColor="#dc2743" />
          </linearGradient>
        </defs>
        <rect x="208" y="88" width="12" height="12" rx="3" fill="url(#igGrad)" />
        {/* Hashtags */}
        <rect x="40" y="132" width="36" height="14" rx="7" fill="rgba(232,156,127,0.2)" stroke="#E89C7F" strokeWidth="1" />
        <rect x="84" y="132" width="48" height="14" rx="7" fill="rgba(212,175,55,0.2)" stroke="#D4AF37" strokeWidth="1" />
        <rect x="140" y="132" width="40" height="14" rx="7" fill="rgba(232,156,127,0.15)" stroke="#E89C7F" strokeWidth="1" />
        <rect x="40" y="154" width="28" height="14" rx="7" fill="rgba(212,175,55,0.15)" stroke="#D4AF37" strokeWidth="1" />
        <rect x="76" y="154" width="52" height="14" rx="7" fill="rgba(232,156,127,0.1)" stroke="#E89C7F" strokeWidth="1" />
      </svg>
    ),
  },
]

interface FeaturesSectionProps {
  className?: string
}

export function FeaturesSection({ className }: FeaturesSectionProps) {
  return (
    <section
      className={cn("py-24 px-6 bg-[var(--cream,#F5EFE6)]", className)}
      aria-label="Features"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <span className="mb-4 block text-xs font-semibold uppercase tracking-widest text-[var(--copper,#B87333)]">
            Why Markentine
          </span>
          <h2
            className="mx-auto max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-[var(--brown-dk,#3E2723)] md:text-5xl"
            style={{ fontFamily: "'Roboto', sans-serif" }}
          >
            Everything a media team does,{" "}
            <span className="italic text-[var(--terra,#E89C7F)]">in four minutes.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--brown-md,#6D4C41)]">
            Markentine combines live fact-checking, AI image generation, cinematic video, and platform copywriting into one seamless workflow.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--taupe-d,#C9B8A0)] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              {/* Graphic area */}
              <div className="flex items-center justify-center p-6">
                <div className="w-full max-w-[260px]">{feature.graphic}</div>
              </div>

              {/* Text */}
              <div className="flex flex-1 flex-col gap-3 border-t border-[var(--border,rgba(62,39,35,.09))] px-6 py-5">
                <h3
                  className="text-lg font-semibold text-[var(--brown-dk,#3E2723)]"
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--brown-lt,#8D6E63)]">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

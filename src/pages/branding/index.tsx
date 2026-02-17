import { Meta } from '@/layouts/Meta';

import {
  BRAND_COLORS,
  LOGO_RULES,
  LOGO_VARIATIONS,
  SECTIONS,
  TYPOGRAPHY,
} from '@/features/stfun/components/branding/brandConstants';
import BrandingColorSwatch from '@/features/stfun/components/branding/BrandingColorSwatch';
import BrandingSectionHeader from '@/features/stfun/components/branding/BrandingSectionHeader';
import BrandingSTLogo from '@/features/stfun/components/branding/BrandingSTLogo';
import BrandingTypeSample from '@/features/stfun/components/branding/BrandingTypeSample';

export default function Branding() {
  return (
    <>
      <Meta
        title="Brand Guidelines | Superteam"
        description="Superteam brand guidelines: logo, colors, typography, and usage rules."
      />

      <div className="col-span-5 flex min-h-screen flex-col pb-32">
        <div className="flex gap-16">
          {/* Sticky TOC Sidebar - desktop only */}
          <aside className="sticky top-24 hidden h-fit w-48 shrink-0 lg:block">
            <p className="font-secondary mb-6 text-xs font-bold tracking-widest text-[#f4a60b] uppercase">
              Contents
            </p>
            <nav className="flex flex-col gap-3">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="font-secondary text-xs text-white/40 transition-colors hover:text-white"
                >
                  <span className="mr-2 text-white/20">{s.num}</span>
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="min-w-0 flex-1">
            {/* 1. Primary Logo */}
            <BrandingSectionHeader num="1" title="Primary Logo" id="logo" />
            <p className="font-secondary mb-8 max-w-xl text-sm leading-relaxed text-white/70">
              This is the primary mark that should be used on all collateral.
            </p>
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white p-16">
              <BrandingSTLogo fill="#000000" size={160} showWordmark />
            </div>

            {/* 2. Symbol */}
            <BrandingSectionHeader num="2" title="Symbol" id="symbol" />
            <p className="font-secondary mb-8 max-w-xl text-sm leading-relaxed text-white/70">
              The symbol without the word &apos;Superteam&apos; is to be used in
              spaces where the name already is mentioned adjacently, in formats
              such as Twitter and Youtube.
            </p>
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white p-16">
              <BrandingSTLogo fill="#000000" size={160} />
            </div>

            {/* 3. Colour Variations */}
            <BrandingSectionHeader
              num="3"
              title="Colour Variations"
              id="colors"
            />
            <p className="font-secondary mb-8 max-w-xl text-sm leading-relaxed text-white/70">
              The Superteam logo is primarily used in yellow against the purple
              background or vice versa. Otherwise it can be used in black,
              yellow or purple in white backgrounds but only in white on black
              backgrounds.
            </p>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
              {LOGO_VARIATIONS.map((v) => (
                <div
                  key={v.label}
                  className="flex flex-col items-center gap-4 rounded-xl p-10"
                  style={{ backgroundColor: v.bg }}
                >
                  <BrandingSTLogo fill={v.fill} size={80} showWordmark />
                  <span
                    className="font-secondary mt-2 text-[10px]"
                    style={{ color: v.labelColor }}
                  >
                    {v.label}
                  </span>
                </div>
              ))}
            </div>

            {/* 4. Colour Palette */}
            <BrandingSectionHeader
              num="4"
              title="Colour Palette"
              id="palette"
            />
            <p className="font-secondary mb-8 max-w-xl text-sm leading-relaxed text-white/70">
              The colour palette of Superteam is set to a theme of Super Purple
              and Super Yellow. Purple connoting the Solana ecosystem works as a
              background both conceptually and literally for Superteam.
            </p>
            <div className="flex flex-wrap justify-center gap-10 rounded-xl border border-white/10 bg-[#121212] p-10">
              {Object.values(BRAND_COLORS)
                .slice(0, 4)
                .map((c) => (
                  <BrandingColorSwatch
                    key={c.hex}
                    hex={c.hex}
                    rgb={c.rgb}
                    name={c.name}
                    large
                  />
                ))}
            </div>

            {/* Gradients */}
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="h-28 rounded-xl bg-gradient-to-r from-[#f4a60b] to-[#5522e0]" />
              <div className="h-28 rounded-xl bg-gradient-to-r from-[#5522e0] to-[#f4a60b]" />
            </div>

            {/* 5. Typography */}
            <BrandingSectionHeader num="5" title="Typography" id="typography" />
            <p className="font-secondary mb-8 max-w-xl text-sm leading-relaxed text-white/70">
              The chosen typeface for Superteam is Archivo Semi Expanded, in
              various weights. The hierarchy is intuitive and is expanded upon
              for the website.
            </p>
            <div className="rounded-xl border border-white/10 bg-[#121212] p-8">
              {Object.values(TYPOGRAPHY).map((t) => (
                <BrandingTypeSample key={t.label} {...t} />
              ))}
            </div>

            {/* Alphabet specimen */}
            <div className="mt-8 rounded-xl border border-white/10 bg-[#121212] p-8">
              <p className="mb-3 text-xs text-white/40">
                Archivo Semi Expanded Medium
              </p>
              <p className="font-secondary text-lg tracking-wide text-white/80">
                ABCDEFGHIJKLMNOPQRSTUVWXYZ
              </p>
              <p className="font-secondary mt-1 text-lg tracking-wide text-white/80">
                abcdefghijklmnopqrstuvwxyz
              </p>
              <p className="font-secondary mt-1 text-lg tracking-wide text-white/80">
                1234567890
              </p>
            </div>

            {/* 6. Incorrect Usage */}
            <BrandingSectionHeader
              num="6"
              title="Incorrect Usage"
              id="incorrect"
            />
            <p className="font-secondary mb-8 max-w-xl text-sm leading-relaxed text-white/70">
              Always use approved master artwork. Never alter or recreate the
              logo.
            </p>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {LOGO_RULES.donts.map((rule) => (
                <div
                  key={rule}
                  className="rounded-xl border border-red-500/20 bg-[#121212] p-5"
                >
                  <p className="font-secondary mb-3 text-[10px] font-bold text-red-400 uppercase">
                    No
                  </p>
                  <p className="font-secondary text-xs leading-relaxed text-white/50">
                    {rule}
                  </p>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

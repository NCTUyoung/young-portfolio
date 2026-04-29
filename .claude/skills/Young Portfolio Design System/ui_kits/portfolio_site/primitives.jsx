// Primitives — shared atoms for the Young Portfolio UI kit.
// Mirrors classes from app/assets/css/main.css and tailwind.config.js.

const Hairline = ({ className = "", vertical = false }) =>
  vertical ? <div className={`jp-hairline-v ${className}`} /> : <div className={`jp-hairline ${className}`} />;

const Eyebrow = ({ children, accent, className = "" }) => (
  <p className={`jp-eyebrow ${accent ? "jp-eyebrow-accent" : ""} ${className}`}>
    <span>{children}</span>
  </p>
);

const Seal = ({ children = "楊", size = 36, className = "" }) => (
  <span
    className={`jp-seal ${className}`}
    style={{ width: size, height: size, fontSize: size * 0.42 }}
  >
    {children}
  </span>
);

const SectionTitle = ({ children, ruby, size = "3xl" }) => {
  const sizes = { "2xl": 28, "3xl": 36, "4xl": 48, "5xl": 60 };
  return (
    <h2 className="jp-section-title" style={{ fontSize: sizes[size] }}>
      {children}
      {ruby && <span className="jp-section-ruby">{ruby}</span>}
    </h2>
  );
};

const Arrow = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

const CTA = ({ jp, lat, muted, onClick }) => (
  <a
    onClick={onClick}
    className="cta-link"
    style={{
      display: "inline-flex", alignItems: "center", gap: 12,
      color: muted ? "var(--fg-muted)" : "var(--fg-2)",
      borderBottom: muted ? "0" : "1px solid var(--border-soft)",
      paddingBottom: muted ? 0 : 8, paddingRight: 8, cursor: "pointer",
      transition: "border-color .5s, color .5s",
      textDecoration: "none",
    }}
  >
    <span style={{ fontFamily: "var(--font-jp)", fontSize: 17, letterSpacing: ".25em" }}>{jp}</span>
    {lat && <span style={{ fontSize: 11, letterSpacing: ".32em", textTransform: "uppercase", color: "var(--fg-muted)" }}>{lat}</span>}
    <Arrow />
  </a>
);

const VerticalKanji = ({ children, size = 80, className = "" }) => (
  <span
    className={className}
    style={{
      writingMode: "vertical-rl", textOrientation: "upright",
      fontFamily: "var(--font-jp)", fontWeight: 200, fontSize: size,
      letterSpacing: ".25em", lineHeight: 1.05, color: "var(--fg-faint)",
      userSelect: "none", pointerEvents: "none",
    }}
  >
    {children}
  </span>
);

const Frame = ({ children, className = "", style = {} }) => (
  <div className={`jp-frame ${className}`} style={style}>{children}</div>
);

// Photo placeholder block (used when we don't have real images attached)
const Photo = ({ kanji, ratio = "4/5", tone = "stone", style = {} }) => {
  const grads = {
    stone: "linear-gradient(135deg,#d6d3d1,#a8a29e)",
    warm:  "linear-gradient(135deg,#e7e5e4,#a3491f)",
    cool:  "linear-gradient(135deg,#44403c,#0f4c75)",
    pink:  "linear-gradient(135deg,#fad0c4,#a8a29e)",
    green: "linear-gradient(135deg,#aab8a0,#57534e)",
    night: "linear-gradient(135deg,#1c1917,#3a2a14)",
  };
  return (
    <div style={{
      width: "100%", aspectRatio: ratio, background: grads[tone] || grads.stone,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-jp)", fontWeight: 200, fontSize: "clamp(48px,12vw,140px)",
      color: "rgba(255,255,255,.55)", overflow: "hidden", ...style,
    }}>
      {kanji}
    </div>
  );
};

Object.assign(window, { Hairline, Eyebrow, Seal, SectionTitle, Arrow, CTA, VerticalKanji, Frame, Photo });

// HomeHero — 余白 display kanji + collage of three vertical photos.
function HomeHero({ onNavigate }) {
  return (
    <section style={{
      position: "relative", display: "flex", alignItems: "stretch",
      minHeight: 560, height: "78vh", maxHeight: 720, overflow: "hidden",
      flexDirection: "row-reverse", background: "var(--bg)",
    }}>
      {/* Right (desktop): 3-image collage */}
      <div style={{ position: "relative", height: "100%", width: "58%", overflow: "hidden", background: "var(--surface)", padding: "24px 12px", display: "flex", alignItems: "stretch", gap: 12 }}>
        <figure style={{ position: "relative", flex: 1, transform: "translateY(16px)", overflow: "hidden", margin: 0 }}>
          <Photo kanji="繪" tone="cool" ratio="auto" style={{ height: "100%", aspectRatio: "auto" }} />
          <figcaption style={{ position: "absolute", bottom: 12, left: 12, fontFamily: "var(--font-jp)", fontSize: 11, letterSpacing: ".35em", color: "#fafaf9", background: "rgba(28,25,23,.55)", padding: "3px 8px", textTransform: "uppercase" }}>Digital</figcaption>
        </figure>
        <figure style={{ position: "relative", flex: 1.3, transform: "translateY(-8px)", overflow: "hidden", margin: 0 }}>
          <Photo kanji="桜" tone="pink" ratio="auto" style={{ height: "100%", aspectRatio: "auto" }} />
        </figure>
        <figure style={{ position: "relative", flex: 1, transform: "translateY(32px)", overflow: "hidden", margin: 0 }}>
          <Photo kanji="影" tone="green" ratio="auto" style={{ height: "100%", aspectRatio: "auto" }} />
          <figcaption style={{ position: "absolute", bottom: 12, right: 12, fontFamily: "var(--font-jp)", fontSize: 11, letterSpacing: ".35em", color: "#fafaf9", background: "rgba(28,25,23,.55)", padding: "3px 8px", textTransform: "uppercase" }}>Photo</figcaption>
        </figure>
      </div>

      {/* Left: text block */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", height: "100%", width: "42%", padding: "0 24px 0 64px", background: "var(--bg)" }}>
        <aside style={{ position: "absolute", top: 0, bottom: 0, right: 0, display: "flex", alignItems: "center", paddingRight: 16 }}>
          <span style={{ writingMode: "vertical-rl", fontFamily: "var(--font-jp)", fontSize: 22, fontWeight: 300, letterSpacing: ".5em", color: "var(--fg-3)", lineHeight: 1, userSelect: "none" }}>
            繪<span style={{ display: "block", height: 12 }}/>と<span style={{ display: "block", height: 12 }}/>影
          </span>
        </aside>

        <div style={{ width: "100%", maxWidth: 520, paddingRight: 48 }}>
          <h1 style={{ margin: 0 }}>
            <span style={{ display: "block", fontFamily: "var(--font-jp)", fontWeight: 200, fontSize: "clamp(56px,7vw,120px)", letterSpacing: ".14em", color: "var(--fg-1)", lineHeight: 1 }}>
              余<span style={{ display: "inline-block", marginLeft: 24, marginRight: 24 }}/>白
            </span>
            <span style={{ marginTop: 24, display: "flex", alignItems: "baseline", gap: 16 }}>
              <span style={{ height: 1, width: 48, background: "var(--fg-faint)", opacity: .8 }}/>
              <span style={{ fontSize: 14, letterSpacing: ".32em", textTransform: "uppercase", color: "var(--fg-3)", fontWeight: 300 }}>Digital Art &amp; Photography</span>
            </span>
          </h1>
          <div style={{ marginTop: 56, display: "flex", flexWrap: "wrap", gap: "16px 32px", alignItems: "center" }}>
            <CTA jp="作品を見る" lat="Gallery" onClick={() => onNavigate("gallery")} />
            <CTA jp="文章を読む" muted onClick={() => onNavigate("article")} />
          </div>
        </div>
      </div>
    </section>
  );
}
window.HomeHero = HomeHero;

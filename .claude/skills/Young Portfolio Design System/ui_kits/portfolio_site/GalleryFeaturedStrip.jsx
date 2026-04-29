// GalleryFeaturedStrip — left vertical "精選" + 2 hero photos.
function GalleryFeaturedStrip() {
  return (
    <section style={{ padding: "24px 32px" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto", display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: 16, alignItems: "stretch" }}>
        <aside style={{ background: "var(--bg-sub)", padding: "24px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 380 }}>
          <span style={{ fontSize: 10, letterSpacing: ".5em", textTransform: "uppercase", color: "var(--accent-500)", fontWeight: 300 }}>FEATURED<br/>SERIES</span>
          <span style={{ writingMode: "vertical-rl", fontFamily: "var(--font-jp)", fontSize: 26, fontWeight: 200, letterSpacing: ".4em", color: "var(--fg-2)", margin: "auto 0" }}>精選</span>
          <span style={{ writingMode: "vertical-rl", fontSize: 10, letterSpacing: ".5em", color: "var(--fg-muted)", margin: "0 auto" }}>HORIZONTAL CUT</span>
          <span style={{ fontSize: 10, letterSpacing: ".4em", color: "var(--fg-muted)" }}>SCROLL ↓</span>
        </aside>
        <Photo kanji="人" tone="pink" ratio="auto" style={{ height: 380, aspectRatio: "auto" }}/>
        <Photo kanji="影" tone="green" ratio="auto" style={{ height: 380, aspectRatio: "auto" }}/>
      </div>
      <p style={{ textAlign: "center", marginTop: 20, fontSize: 11, letterSpacing: ".4em", textTransform: "uppercase", color: "var(--fg-muted)" }}>Featured · 08 Frames · 二〇二六</p>
    </section>
  );
}
window.GalleryFeaturedStrip = GalleryFeaturedStrip;

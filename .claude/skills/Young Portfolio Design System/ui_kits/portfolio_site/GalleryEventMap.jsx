// GalleryEventMap — visited-places strip with pins (Leaflet placeholder).
function GalleryEventMap() {
  const pins = [
    { x: "55%", y: "55%", name: "台北 / Taipei" },
    { x: "62%", y: "42%", name: "東京 / Tokyo" },
    { x: "68%", y: "60%", name: "嘎嘎湖" },
  ];
  return (
    <section style={{ padding: "24px 32px 8px" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <span style={{ fontSize: 11, letterSpacing: ".4em", textTransform: "uppercase", color: "var(--accent-500)", fontWeight: 300 }}>— Visited Places · 切れた場所</span>
          <span style={{ fontSize: 11, letterSpacing: ".4em", textTransform: "uppercase", color: "var(--fg-muted)" }}>12 Locations</span>
        </div>
        <div style={{ position: "relative", height: 180, background: "#f5f5f4", borderTop: "1px solid var(--border-soft)", borderBottom: "1px solid var(--border-soft)", overflow: "hidden" }}>
          <svg viewBox="0 0 1000 180" preserveAspectRatio="none" width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: .35 }}>
            <path d="M50,90 Q140,40 220,80 T380,90 Q450,130 540,90 T700,70 Q780,90 850,80 T960,90" stroke="#a8a29e" strokeWidth="1" fill="none"/>
            <path d="M0,120 Q120,160 280,140 T540,150 Q660,130 800,140 T1000,135" stroke="#d6d3d1" strokeWidth=".8" fill="none"/>
          </svg>
          <span style={{ position: "absolute", left: "30%", top: "22%", fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: ".3em", color: "var(--fg-muted)" }}>EUROPE</span>
          <span style={{ position: "absolute", left: "60%", top: "22%", fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: ".3em", color: "var(--fg-muted)" }}>ASIA</span>
          <span style={{ position: "absolute", left: "82%", top: "22%", fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: ".3em", color: "var(--fg-muted)" }}>N. AMERICA</span>
          {pins.map((p, i) => (
            <span key={i} style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%,-50%)", width: 14, height: 14, border: "2px solid var(--accent-500)", borderRadius: "50%", background: "#fdf8f0", cursor: "pointer" }} title={p.name}/>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 28, fontFamily: "var(--font-jp)", fontSize: 18, fontWeight: 300, letterSpacing: ".3em", color: "var(--fg-3)" }}>まだ、撮っている。</p>
      </div>
    </section>
  );
}
window.GalleryEventMap = GalleryEventMap;

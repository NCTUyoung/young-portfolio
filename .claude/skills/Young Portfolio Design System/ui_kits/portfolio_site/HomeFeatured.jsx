// HomeFeatured — featured works grid + link to gallery.
function HomeFeatured({ onNavigate }) {
  const items = [
    { kanji: "繪", t: "2025 電繪新作", c: "Digital Art", tone: "cool" },
    { kanji: "春", t: "春日街拍", c: "Photography", tone: "pink" },
    { kanji: "影", t: "米倉團拍", c: "Photography", tone: "green" },
    { kanji: "人", t: "2024 角色設計", c: "Digital Art", tone: "warm" },
    { kanji: "夜", t: "新北耶誕城", c: "Photography", tone: "night" },
    { kanji: "畫", t: "2023 插畫作品", c: "Digital Art", tone: "stone" },
  ];
  return (
    <section style={{ position: "relative", padding: "120px 32px", background: "var(--bg-sub)" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto" }}>
        <header style={{ marginBottom: 56, display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
          <SectionTitle ruby="Featured Works" size="4xl">選</SectionTitle>
          <a onClick={() => onNavigate("gallery")} style={{ fontSize: 12, letterSpacing: ".35em", textTransform: "uppercase", color: "var(--fg-muted)", display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <span style={{ fontFamily: "var(--font-jp)", letterSpacing: ".35em" }}>全てを見る</span>
            <Arrow size={14}/>
          </a>
        </header>

        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {items.map((w, i) => (
            <li key={i}>
              <a onClick={() => onNavigate("gallery")} style={{ display: "block", position: "relative", overflow: "hidden", aspectRatio: "4/5", background: "var(--surface-2)", cursor: "pointer" }}>
                <Photo kanji={w.kanji} tone={w.tone} ratio="auto" style={{ height: "100%", aspectRatio: "auto" }}/>
                <div className="hover-overlay" style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(28,25,23,.75) 0,rgba(28,25,23,.15) 30%,transparent 60%)", opacity: 0, transition: "opacity .5s" }}/>
                <div className="hover-cap" style={{ position: "absolute", left: 16, right: 16, bottom: 14, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "flex-end", opacity: 0, transform: "translateY(8px)", transition: "all .5s" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-jp)", fontSize: 16, letterSpacing: ".15em" }}>{w.t}</div>
                    <div style={{ fontSize: 10, letterSpacing: ".35em", textTransform: "uppercase", opacity: .7, marginTop: 4 }}>{w.c}</div>
                  </div>
                  <span style={{ writingMode: "vertical-rl", fontFamily: "var(--font-jp)", fontSize: 11, letterSpacing: ".4em", opacity: .7 }}>{w.kanji}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <style>{`
        .hover-overlay:hover, li:hover .hover-overlay { opacity: 1; }
        li:hover .hover-cap { opacity: 1; transform: translateY(0); }
      `}</style>
    </section>
  );
}
window.HomeFeatured = HomeFeatured;

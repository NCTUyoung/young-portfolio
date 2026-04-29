// GalleryControls — category tabs + event chips + search + year.
function GalleryControls({ category, setCategory, event, setEvent, year, setYear }) {
  const cats = [
    { id: "digital", label: "數位繪圖", count: 35 },
    { id: "photography", label: "攝影作品", count: 80 },
    { id: "all", label: "全部作品", count: 115 },
  ];
  const events = category === "photography"
    ? ["全事件 · 80","Annber 外拍 · 9","嘎嘎湖風刮野木 · 13","WBC 2026 · 12","WBC東京 台澳 · 8","2025 聖誕台北 · 4","果子外拍 · 8","春日街拍 · 5","2025 桃頭三本柱 · 5","攝影社 米倉團拍 · 4","調色測試 · 3","2024新北耶誕城 · 4","交大外拍 · 5"]
    : ["全事件 · 35","2026年電繪作品 · 2","2025年電繪作品 · 5","2024年電繪作品 · 5","2023年電繪作品 · 4","2022年電繪作品 · 6","2021年電繪作品 · 3","2018年電繪作品 · 10"];
  return (
    <section style={{ padding: "32px 32px 24px" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto" }}>
        <Eyebrow accent>Gallery</Eyebrow>
        <h1 style={{ margin: "8px 0 4px", fontFamily: "var(--font-sans)", fontSize: 44, fontWeight: 300, color: "var(--fg-1)" }}>
          Works <span style={{ display: "inline-block", width: 32, height: 1, background: "var(--fg-faint)", verticalAlign: "middle", marginLeft: 12 }}/>
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--fg-muted)" }}>
          <span style={{ color: "var(--accent-600)", fontWeight: 500 }}>{category === "digital" ? "Digital Art" : category === "photography" ? "Photography" : "All"}</span>
          <span style={{ margin: "0 8px" }}>·</span>{cats.find(c => c.id === category).count} works
        </p>

        <div style={{ marginTop: 28, display: "flex", gap: 28, flexWrap: "wrap" }}>
          {cats.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)} style={{
              border: 0, background: "transparent", padding: "0 0 8px",
              fontSize: 14, color: c.id === category ? "var(--fg-1)" : "var(--fg-muted)",
              borderBottom: c.id === category ? "1px solid var(--accent-500)" : "1px solid transparent",
              cursor: "pointer", letterSpacing: ".05em",
            }}>{c.label}<span style={{ marginLeft: 8, fontSize: 11, color: c.id === category ? "var(--accent-600)" : "var(--fg-faint)" }}>{c.count}</span></button>
          ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 10, letterSpacing: ".4em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: 14 }}>Event</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 28px" }}>
            {events.map((e, i) => {
              const [name, count] = e.split(" · ");
              const active = i === 0;
              return (
                <button key={e} style={{
                  border: 0, background: "transparent", padding: 0, cursor: "pointer",
                  fontSize: 13, color: active ? "var(--fg-1)" : "var(--fg-muted)",
                  borderBottom: active ? "1px solid var(--accent-500)" : "1px solid transparent",
                  paddingBottom: 4,
                }}>{name} <span style={{ color: active ? "var(--accent-600)" : "var(--fg-faint)", fontSize: 11, marginLeft: 6 }}>{count}</span></button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 32, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, display: "flex", alignItems: "center", gap: 10, paddingBottom: 8, borderBottom: "1px solid var(--border-soft)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ color: "var(--fg-muted)" }}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
            <input placeholder={`搜尋${category === "digital" ? "數位" : "攝影"}作品（標題、描述、標籤）`} style={{ border: 0, background: "transparent", flex: 1, fontSize: 13, color: "var(--fg-2)", outline: "none" }}/>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, letterSpacing: ".35em", textTransform: "uppercase", color: "var(--fg-muted)" }}>Year</span>
            <select value={year} onChange={e => setYear(e.target.value)} style={{ background: "transparent", border: "1px solid var(--border-soft)", padding: "6px 10px", fontSize: 12, color: "var(--fg-2)" }}>
              <option>全部年份</option><option>2026</option><option>2025</option><option>2024</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
window.GalleryControls = GalleryControls;

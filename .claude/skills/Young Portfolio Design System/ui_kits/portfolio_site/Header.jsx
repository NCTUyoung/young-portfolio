// Header — sticky navigation with logo lockup + theme dot.
function Header({ route, onNavigate, scrolled = false }) {
  const items = [
    { id: "home", label: "首頁" },
    { id: "gallery", label: "圖片庫" },
    { id: "article", label: "文章" },
    { id: "admin", label: "後台管理" },
  ];
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      background: scrolled ? "rgba(250,250,249,0.92)" : "var(--bg)",
      backdropFilter: scrolled ? "blur(16px) saturate(140%)" : "none",
      borderBottom: scrolled ? "1px solid var(--border-soft)" : "0",
      transition: "all .35s ease",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 32px", display: "flex", alignItems: "center", gap: 32 }}>
        <a onClick={() => onNavigate("home")} style={{ display: "flex", alignItems: "baseline", gap: 8, cursor: "pointer", textDecoration: "none" }}>
          <span style={{ borderLeft: "1.4px solid var(--fg-1)", paddingLeft: 10, fontWeight: 700, fontSize: 22, letterSpacing: ".06em", color: "var(--fg-1)" }}>NCTU</span>
          <span style={{ fontWeight: 300, fontSize: 14, letterSpacing: ".36em", color: "var(--fg-muted)" }}>YOUNG</span>
        </a>
        <nav style={{ marginLeft: "auto", display: "flex", gap: 32 }}>
          {items.map(it => (
            <a key={it.id} onClick={() => onNavigate(it.id)} style={{
              fontSize: 14, color: route === it.id ? "var(--fg-1)" : "var(--fg-3)",
              cursor: "pointer", textDecoration: "none",
              borderBottom: route === it.id ? "1px solid var(--accent-500)" : "1px solid transparent",
              paddingBottom: 4, transition: "all .3s",
            }}>{it.label}</a>
          ))}
        </nav>
        <div style={{ width: 14, height: 14, border: "1px solid var(--border)", borderRadius: "50%", marginLeft: 8 }} />
      </div>
    </header>
  );
}
window.Header = Header;

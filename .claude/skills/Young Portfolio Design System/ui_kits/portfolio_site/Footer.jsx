// Footer — minimal credit + sumi dot.
function Footer() {
  return (
    <footer style={{ padding: "48px 32px", borderTop: "1px solid var(--border-soft)", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ borderLeft: "1.4px solid var(--fg-1)", paddingLeft: 10, fontWeight: 700, fontSize: 18, letterSpacing: ".06em", color: "var(--fg-1)" }}>NCTU</span>
          <span style={{ fontWeight: 300, fontSize: 12, letterSpacing: ".36em", color: "var(--fg-muted)" }}>YOUNG</span>
        </div>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: ".25em", color: "var(--fg-muted)" }}>© 2026 NCTU Young · 作品集 / Portfolio · 不完美之中，藏著最真實的美。</p>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--fg-3)" }}/>
      </div>
    </footer>
  );
}
window.Footer = Footer;

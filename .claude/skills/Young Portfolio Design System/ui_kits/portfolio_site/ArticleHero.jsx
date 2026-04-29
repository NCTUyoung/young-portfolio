// ArticleHero — coming-soon hero + preview cards.
function ArticleHero({ onNavigate }) {
  const cards = [
    { t: "設計心得", d: "分享數位繪圖與攝影構圖的思考過程，從靈感發想到作品完成的創作筆記。", icon: "pen" },
    { t: "技術筆記", d: "記錄 Vue、Nuxt、Tailwind CSS 等前端技術的學習心得與實作經驗。", icon: "code" },
    { t: "創作故事", d: "每個作品背後的靈感來源與創作過程，分享從構思到完成的完整故事。", icon: "bulb" },
    { t: "器材評測", d: "繪圖板、相機鏡頭等使用心得與比較分析。", icon: "cam" },
  ];
  return (
    <>
      <section style={{ padding: "48px 32px 0" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto", background: "var(--surface)", borderRadius: 16, padding: "60px 56px", position: "relative", overflow: "hidden", display: "flex", gap: 60, alignItems: "center" }}>
          <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-500)" }}>
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
          </div>
          <div>
            <Eyebrow accent>Coming Soon</Eyebrow>
            <h1 style={{ margin: "8px 0 12px", fontFamily: "var(--font-jp)", fontSize: 56, fontWeight: 200, letterSpacing: ".25em", color: "var(--fg-1)" }}>文章專區</h1>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8, color: "var(--fg-muted)", maxWidth: 480 }}>設計心得、技術筆記與創作故事，正在用心撰寫中。<br/>敬請期待更多精彩內容。</p>
            <div style={{ marginTop: 28, display: "flex", gap: 24, alignItems: "center" }}>
              <button onClick={() => onNavigate("gallery")} style={{ border: 0, background: "var(--accent-500)", color: "#fff", padding: "12px 24px", borderRadius: 8, fontSize: 14, letterSpacing: ".15em", display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer" }}>瀏覽作品集 <Arrow size={14}/></button>
              <a onClick={() => onNavigate("home")} style={{ fontSize: 14, color: "var(--fg-muted)", cursor: "pointer" }}>返回首頁</a>
            </div>
          </div>
          <span style={{ position: "absolute", right: -40, top: -40, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, #faecd9 0%, transparent 60%)" }}/>
        </div>
      </section>

      <section style={{ padding: "60px 32px 100px", background: "var(--bg-sub)" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <Eyebrow accent>Preview</Eyebrow>
          <h2 style={{ margin: "8px 0 32px", fontFamily: "var(--font-jp)", fontSize: 32, fontWeight: 200, letterSpacing: ".2em", color: "var(--fg-1)" }}>即將帶來 <span style={{ display:"inline-block", width:80, height:1, background:"var(--accent-300)", verticalAlign:"middle", marginLeft:12 }}/></h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
            {cards.map(c => (
              <div key={c.t} style={{ background: "var(--bg)", border: "1px solid var(--border-soft)", borderRadius: 8, padding: 22 }}>
                <div style={{ width: 32, height: 32, color: "var(--fg-3)", marginBottom: 16 }}><CardIcon kind={c.icon}/></div>
                <h3 style={{ margin: 0, fontFamily: "var(--font-jp)", fontSize: 18, fontWeight: 300, letterSpacing: ".18em", color: "var(--fg-2)" }}>{c.t}</h3>
                <p style={{ margin: "8px 0 0", fontSize: 12, lineHeight: 1.7, color: "var(--fg-muted)" }}>{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function CardIcon({ kind }) {
  const p = { width: 26, height: 26, fill: "none", stroke: "currentColor", strokeWidth: 1.2, viewBox: "0 0 24 24" };
  if (kind === "pen") return <svg {...p}><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>;
  if (kind === "code") return <svg {...p}><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>;
  if (kind === "bulb") return <svg {...p}><path d="M9 21h6M12 17v4M5 8a7 7 0 1114 0c0 3-2 4-3 6H8c-1-2-3-3-3-6z"/></svg>;
  return <svg {...p}><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="4"/></svg>;
}

window.ArticleHero = ArticleHero;

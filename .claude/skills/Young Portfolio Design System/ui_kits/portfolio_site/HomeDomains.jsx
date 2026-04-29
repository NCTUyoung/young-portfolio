// HomeDomains — Digital / Photography 對聯 with central jp-hairline-v.
function HomeDomains() {
  const digital = ["電繪插畫", "角色設計", "風景繪製", "概念藝術", "幾何風格"];
  const photo = ["街頭攝影", "活動紀實", "淺景深", "夜間攝影", "望遠鏡頭"];
  return (
    <section style={{ position: "relative", padding: "120px 32px", background: "var(--bg-sub)" }}>
      <Hairline className="" />
      <div style={{ maxWidth: 1152, margin: "0 auto" }}>
        <header style={{ marginBottom: 64, textAlign: "center" }}>
          <SectionTitle ruby="Domains" size="4xl">領域</SectionTitle>
        </header>
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ position: "absolute", top: 24, bottom: 24, left: "50%", transform: "translateX(-1px)", width: 1, background: "linear-gradient(to bottom,transparent,#d6d3d1b3 15%,#d6d3d1b3 85%,transparent)" }}/>

          <article style={{ padding: "16px 40px", textAlign: "right" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-start", gap: 20, marginBottom: 24 }}>
              <div style={{ flex: 1, maxWidth: 288 }}>
                <Eyebrow>Digital</Eyebrow>
                <h3 style={{ margin: "12px 0 0", fontFamily: "var(--font-jp)", fontSize: 36, fontWeight: 200, letterSpacing: ".3em", color: "var(--fg-2)" }}>數位電繪</h3>
              </div>
              <VerticalKanji size={80}>繪</VerticalKanji>
            </div>
            <p className="t-body-jp" style={{ color: "var(--fg-muted)", maxWidth: 384, marginLeft: "auto" }}>二〇一八年起累積電繪作品——自幾何化的動物插畫、人物，至場景與概念藝術，嘗試不同風格與筆觸。</p>
            <ul style={{ marginTop: 24, padding: 0, listStyle: "none", fontSize: 12, letterSpacing: ".35em", color: "var(--fg-muted)", fontFamily: "var(--font-jp)", lineHeight: 2 }}>
              {digital.map(t => <li key={t}>{t}</li>)}
            </ul>
          </article>

          <article style={{ padding: "16px 40px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 24 }}>
              <VerticalKanji size={80}>影</VerticalKanji>
              <div style={{ flex: 1, maxWidth: 288 }}>
                <Eyebrow>Photography</Eyebrow>
                <h3 style={{ margin: "12px 0 0", fontFamily: "var(--font-jp)", fontSize: 36, fontWeight: 200, letterSpacing: ".3em", color: "var(--fg-2)" }}>攝影紀錄</h3>
              </div>
            </div>
            <p className="t-body-jp" style={{ color: "var(--fg-muted)", maxWidth: 384 }}>以 Nikon Z f 為主，記錄街景、活動與夜景；偏愛淺景深與自然光，讓畫面保留現場氛圍。</p>
            <ul style={{ marginTop: 24, padding: 0, listStyle: "none", fontSize: 12, letterSpacing: ".35em", color: "var(--fg-muted)", fontFamily: "var(--font-jp)", lineHeight: 2 }}>
              {photo.map(t => <li key={t}>{t}</li>)}
            </ul>
          </article>
        </div>
      </div>
      <Hairline />
    </section>
  );
}
window.HomeDomains = HomeDomains;

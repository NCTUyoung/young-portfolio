// HomeAbout — left avatar in jp-frame + right text + social links.
function HomeAbout() {
  return (
    <section style={{ padding: "120px 32px" }}>
      <div style={{ maxWidth: 1024, margin: "0 auto" }}>
        <header style={{ marginBottom: 64, display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <SectionTitle ruby="About" size="4xl">自己紹介</SectionTitle>
          <span className="t-vertical-caption" style={{ writingMode: "vertical-rl" }}>一</span>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: 64, alignItems: "start" }}>
          <div style={{ position: "relative" }}>
            <Frame style={{ background: "var(--surface)", aspectRatio: "4/5", overflow: "hidden", position: "relative" }}>
              <img src="../../assets/avatar-young.jpg" alt="Young" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
              <span style={{ position: "absolute", bottom: 16, right: 20, fontFamily: "var(--font-jp)", fontSize: 64, fontWeight: 200, color: "rgba(255,255,255,.3)", lineHeight: 1, userSelect: "none" }}>寫</span>
            </Frame>
            <div style={{ position: "absolute", bottom: -12, right: -12 }}><Seal size={42}>楊</Seal></div>
          </div>

          <div style={{ paddingLeft: 16 }}>
            <p style={{ margin: 0, fontFamily: "var(--font-jp)", fontSize: 28, letterSpacing: ".3em", color: "var(--fg-2)", fontWeight: 300 }}>NCTU<span style={{ marginLeft: 8, marginRight: 8 }}/>Young</p>
            <p style={{ marginTop: 4, fontSize: 11, letterSpacing: ".45em", textTransform: "uppercase", color: "var(--fg-muted)", fontWeight: 300 }}>Digital Painter · Photographer</p>
            <Hairline className="my-8" />
            <p className="t-body-jp" style={{ maxWidth: 480 }}>電繪與攝影兩條線並行——插畫自幾何、角色至場景；攝影則以街拍、活動與城市夜景為主，以 Nikon Z 系統將當下的光影留下。</p>
            <p className="t-body-jp" style={{ maxWidth: 480, marginTop: 24, color: "var(--fg-muted)" }}>此處收錄電繪作品與依事件整理的攝影相簿，攝影區附地圖與拍攝資訊。零碎日常亦會在 Instagram 與 Threads 更新。</p>
            <div style={{ marginTop: 36, display: "flex", gap: 16 }}>
              {["github","facebook","instagram","threads","mail"].map(k => (
                <span key={k} style={{ width: 36, height: 36, border: "1px solid var(--border-soft)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-muted)" }}>
                  <SocialIcon kind={k}/>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialIcon({ kind }) {
  const props = { width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 1.2, viewBox: "0 0 24 24" };
  if (kind === "github") return <svg {...props}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3a3 3 0 00-1-2c4 0 6-3 6-7a5 5 0 00-1-4c0-2 0-3-2-3 0 0-2 0-4 1a13 13 0 00-7 0C5 2 3 2 3 4c-1 1-1 2-1 4 0 4 2 7 6 7a3 3 0 00-1 2v3"/></svg>;
  if (kind === "facebook") return <svg {...props}><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>;
  if (kind === "instagram") return <svg {...props}><rect x="3" y="3" width="18" height="18"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7" fill="currentColor"/></svg>;
  if (kind === "threads") return <svg {...props}><path d="M14 2H10a4 4 0 00-4 4v0H4a2 2 0 00-2 2v0h2v8a4 4 0 004 4h6a4 4 0 004-4v-8h2V8a2 2 0 00-2-2h-2v0a4 4 0 00-4-4z"/></svg>;
  return <svg {...props}><rect x="3" y="5" width="18" height="14"/><path d="M3 7l9 7 9-7"/></svg>;
}

window.HomeAbout = HomeAbout;

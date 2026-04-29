// GalleryGrid — masonry-ish grid of photo placeholders (event headers between rows).
function GalleryGrid({ category }) {
  const events = [
    { name: "Annber 外拍", count: 9, items: [{kanji:"人", tone:"pink", ratio:"4/5"},{kanji:"光", tone:"green", ratio:"4/5"},{kanji:"姿", tone:"warm", ratio:"4/5"}] },
    { name: "嘎嘎湖風刮野木", count: 13, items: [{kanji:"湖", tone:"cool", ratio:"4/5"},{kanji:"林", tone:"green", ratio:"4/5"},{kanji:"霧", tone:"stone", ratio:"4/5"}] },
  ];
  if (category === "digital") {
    return (
      <section style={{ padding: "16px 32px 80px" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {Array.from({length: 9}).map((_, i) => {
            const tones = ["cool","pink","warm","stone","night","green"];
            const kanji = "繪劍速兎神光夜星花".charAt(i);
            return <Photo key={i} kanji={kanji} tone={tones[i % tones.length]} ratio="3/4" />;
          })}
        </div>
      </section>
    );
  }
  return (
    <section style={{ padding: "16px 32px 80px" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto" }}>
        {events.map(ev => (
          <div key={ev.name} style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: 22, color: "var(--fg-1)" }}>{ev.name}</h3>
              <span style={{ fontSize: 11, letterSpacing: ".4em", color: "var(--fg-muted)" }}>{ev.count} · 作品</span>
              <Hairline className="" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {ev.items.map((it, i) => (
                <Photo key={i} kanji={it.kanji} tone={it.tone} ratio={it.ratio}/>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
window.GalleryGrid = GalleryGrid;

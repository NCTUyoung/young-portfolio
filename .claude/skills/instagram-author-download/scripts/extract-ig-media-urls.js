async page => {
  const seen = new Map();
  let stableRounds = 0;
  const maxSteps = 600;
  const maxStableRounds = 18;

  const rand = (min, max) => Math.floor(min + Math.random() * (max - min));

  const collectOnce = async () => {
    return await page.evaluate(() => {
      const out = [];
      const anchors = [
        ...document.querySelectorAll('a[href*="/p/"]'),
        ...document.querySelectorAll('a[href*="/reel/"]'),
      ];
      for (const a of anchors) {
        const postUrl = a.href;
        for (const img of a.querySelectorAll('img')) {
          const src = img.currentSrc || img.src || '';
          if (!src) continue;
          if (!/cdninstagram|fbcdn\.net/.test(src)) continue;

          let best = src;
          const srcset = img.srcset || '';
          if (srcset) {
            const candidates = srcset
              .split(',')
              .map(s => s.trim())
              .map(s => {
                const m = s.match(/^(\S+)\s+(\d+)w$/);
                return m ? { url: m[1], w: parseInt(m[2], 10) } : null;
              })
              .filter(Boolean)
              .sort((x, y) => y.w - x.w);
            if (candidates.length) best = candidates[0].url;
          }

          let key = '';
          try {
            const u = new URL(best);
            const parts = u.pathname.split('/');
            key = parts[parts.length - 1];
          } catch {
            continue;
          }
          if (!key) continue;
          out.push({ key, thumbUrl: best, postUrl });
        }
      }
      return out;
    });
  };

  const humanScroll = async step => {
    const delta = rand(600, 1100);
    await page.mouse.wheel(0, delta);
    if (step > 0 && step % 9 === 0) {
      await page.mouse.wheel(0, -rand(150, 300));
    }
  };

  for (let step = 0; step < maxSteps; step++) {
    const before = seen.size;
    const items = await collectOnce();
    for (const { key, thumbUrl, postUrl } of items) {
      if (!seen.has(key)) seen.set(key, { thumbUrl, postUrl });
    }
    const grew = seen.size > before;
    stableRounds = grew ? 0 : stableRounds + 1;
    if (stableRounds >= maxStableRounds) break;

    await humanScroll(step);

    let wait = rand(900, 1600);
    if (step > 0 && step % 7 === 0) wait += rand(800, 1800);
    await page.waitForTimeout(wait);
  }

  return [...seen.entries()].map(([key, v]) => ({ key, thumbUrl: v.thumbUrl, postUrl: v.postUrl }));
}

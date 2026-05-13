async page => {
  const rand = (min, max) => Math.floor(min + Math.random() * (max - min));

  let postUrls = [];
  try {
    postUrls = JSON.parse(process.env.IG_POSTS || '[]');
  } catch {
    postUrls = [];
  }
  if (!Array.isArray(postUrls) || postUrls.length === 0) {
    return { error: 'IG_POSTS env var is empty or invalid JSON' };
  }

  // Cut image/media/font loads — we only need the DOM src to be set,
  // not the bytes. React assigns img.src before the network request.
  await page.route('**', route => {
    const t = route.request().resourceType();
    if (t === 'image' || t === 'media' || t === 'font') {
      return route.abort();
    }
    route.continue();
  });

  const nextSelector = [
    'button[aria-label="下一步"]',
    'button[aria-label="下一個"]',
    'button[aria-label="Next"]',
    'button[aria-label="次へ"]',
  ].join(', ');

  const collectCarousel = async () => {
    return await page.evaluate(() => {
      const out = [];
      const vh = window.innerHeight || 800;
      for (const img of document.querySelectorAll('img')) {
        const src = img.currentSrc || img.src || '';
        if (!src) continue;
        if (!/cdninstagram|fbcdn\.net/.test(src)) continue;
        if (!/\/v\/t51\.[^/]+-15\//.test(src)) continue;
        const r = img.getBoundingClientRect();
        if (r.top > 200) continue;
        if (r.bottom < -vh) continue;
        if (r.width < 400 || r.height < 400) continue;

        let best = src;
        const srcset = img.srcset || '';
        if (srcset) {
          const cands = srcset
            .split(',')
            .map(s => s.trim())
            .map(s => {
              const m = s.match(/^(\S+)\s+(\d+)w$/);
              return m ? { url: m[1], w: parseInt(m[2], 10) } : null;
            })
            .filter(Boolean)
            .sort((a, b) => b.w - a.w);
          if (cands.length) best = cands[0].url;
        }

        let key = '';
        try {
          const u = new URL(best);
          key = u.pathname.split('/').pop() || '';
        } catch {
          continue;
        }
        if (!key) continue;
        out.push({ key, url: best });
      }
      return out;
    });
  };

  const walkPost = async postUrl => {
    const seen = new Map();
    try {
      await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (e) {
      return { postUrl, error: 'goto: ' + String(e.message || e), images: [] };
    }

    await page.waitForTimeout(rand(600, 1000));

    for (const { key, url } of await collectCarousel()) {
      if (!seen.has(key)) seen.set(key, url);
    }

    let safety = 25;
    let stillRounds = 0;
    while (safety-- > 0) {
      const before = seen.size;
      const next = page.locator(nextSelector).first();
      const count = await next.count().catch(() => 0);
      if (count === 0) break;
      try {
        await next.click({ timeout: 1200 });
      } catch {
        break;
      }
      await page.waitForTimeout(rand(400, 750));
      for (const { key, url } of await collectCarousel()) {
        if (!seen.has(key)) seen.set(key, url);
      }
      if (seen.size > before) {
        stillRounds = 0;
      } else {
        stillRounds++;
        if (stillRounds >= 3) break;
      }
    }

    return { postUrl, images: [...seen.values()] };
  };

  const out = [];
  for (let i = 0; i < postUrls.length; i++) {
    const r = await walkPost(postUrls[i]);
    out.push(r);
    // Pacing between posts. Image-abort already keeps each visit short;
    // this keeps the request cadence less mechanical.
    if (i < postUrls.length - 1) {
      let inter = rand(500, 1100);
      if (i > 0 && i % 8 === 0) inter += rand(800, 1600);
      await page.waitForTimeout(inter);
    }
  }
  return out;
}

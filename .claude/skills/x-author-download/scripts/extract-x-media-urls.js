async page => {
  const mediaTab = page.getByRole('tab', { name: /媒體|Media/i });
  if (await mediaTab.count()) {
    await mediaTab.click();
    await page.waitForTimeout(2500);
  }

  const seen = new Set();
  let stableRounds = 0;
  const maxSteps = 900;
  const maxStableRounds = 40;

  const collectUrlsFromDom = async () => {
    return await page.evaluate(() => {
      return [...document.querySelectorAll('img')]
        .map(img => img.src)
        .filter(src => src.includes('pbs.twimg.com/media/'))
        .map(src => {
          const url = new URL(src);
          url.searchParams.set('name', 'orig');
          return url.toString();
        });
    });
  };

  const scrollMediaGrid = async step => {
    await page.mouse.wheel(0, 2400);

    if (step % 4 === 0) {
      await page.keyboard.press('End');
    }

    if (step % 6 === 0) {
      await page.evaluate(() => {
        const nodes = [...document.querySelectorAll('*')]
          .filter(el => {
            const style = window.getComputedStyle(el);
            if (!style) return false;
            const oy = style.overflowY;
            if (oy !== 'auto' && oy !== 'scroll') return false;
            return el.scrollHeight - el.clientHeight > 200;
          })
          .sort((a, b) => (b.scrollHeight * b.clientWidth) - (a.scrollHeight * a.clientWidth));

        const target = nodes[0];
        if (!target) {
          window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'instant' });
          return;
        }

        target.scrollTop = target.scrollHeight;
      });
    }
  };

  for (let step = 0; step < maxSteps; step++) {
    const before = seen.size;

    for (const url of await collectUrlsFromDom()) {
      seen.add(url);
    }

    const grew = seen.size > before;
    stableRounds = grew ? 0 : stableRounds + 1;

    if (stableRounds >= maxStableRounds) break;

    await scrollMediaGrid(step);
    await page.waitForTimeout(650);
  }

  return [...seen];
}

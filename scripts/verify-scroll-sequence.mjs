/** Browser integration checks using in-memory test frames; no database or public assets are changed. */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";
import sharp from "sharp";
import ts from "typescript";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const transpile = async (relative) =>
  ts.transpileModule(await readFile(join(root, relative), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText;
// The player, the shared stage tracker and the manifest contract they both
// read, served as three modules exactly as the browser loads them.
const modules = {
  "/scroll-player.js": (await transpile("src/lib/vocational/scroll-player.ts")).replace(
    './sequence"',
    './sequence.js"',
  ),
  "/scroll-stage.js": await transpile("src/lib/vocational/scroll-stage.ts"),
  "/sequence.js": await transpile("src/lib/vocational/sequence.ts"),
};
const css = await readFile(join(root, "src/app/vocational.css"), "utf8");
const FRAME_COUNT = 150;
const fonts = await Promise.all(
  ["anuphan-thai.woff2", "anuphan-latin.woff2"].map(async (name) => [
    name,
    await readFile(join(root, "public/fonts", name)),
  ]),
);
const frameColor = (frame) => [frame, 255 - frame, (frame * 43) % 256, 255];
const frames = await Promise.all(
  Array.from({ length: FRAME_COUNT }, async (_, index) => {
    const [r, g, b] = frameColor(index + 1);
    return sharp({ create: { width: 160, height: 90, channels: 3, background: { r, g, b } } })
      .png()
      .toBuffer();
  }),
);
const requests = new Map();
const slowResponses = new Set();
let base;

function fixture(scenario) {
  return `<!doctype html><html lang="th"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/vocational.css">
    <style>
      @font-face {font-family:Anuphan;src:url('/fonts/anuphan-thai.woff2');font-weight:100 700}
      @font-face {font-family:Anuphan;src:url('/fonts/anuphan-latin.woff2');font-weight:100 700;unicode-range:U+0000-00FF}
      *,::before,::after {box-sizing:border-box} body,h1,p {margin:0}
      a {color:inherit} img {display:block} .fixture-after {height:110vh}
      :root {--font-sans: Anuphan, sans-serif}
    </style></head><body class="v-site">
    <header class="v-header">Existing navigation</header>
    <main>
    <section class="v-cine" data-sequence="on">
      <div class="v-cine-stage">
        <div class="v-cine-media" aria-hidden="true">
          <canvas class="v-cine-canvas"></canvas>
          <span class="v-cine-veil"></span><span class="v-cine-vignette"></span>
        </div>
        <div class="v-cine-inner">
          <p class="v-cine-badge"><span class="v-cine-badge-dot"></span>ฝ่ายฝึกวิชาชีพผู้ต้องขัง
            <small>ทัณฑสถานบำบัดพิเศษกลาง</small></p>
          <h1 class="v-cine-title">ฝึกอาชีพ<span>สร้างโอกาสใหม่</span></h1>
          <p class="v-cine-lede">พื้นที่แห่งการเรียนรู้และพัฒนาทักษะวิชาชีพ ผ่านการลงมือทำจริง
            <br class="v-break-wide"> สู่ผลงานที่มีคุณค่าและโอกาสในวันข้างหน้า</p>
          <a class="v-pill v-pill-ghost v-cine-action" href="#products">ชมผลิตภัณฑ์ทั้งหมด</a>
        </div>
        <p class="v-cine-cue"><span class="v-cine-cue-rule"></span>เลื่อนเพื่อสำรวจ</p>
      </div>
      <div class="v-cine-seam"></div>
    </section>
    <div class="fixture-after">Following page content</div>
    </main>
    <script type="module">
      import { startScrollSequence } from '/scroll-player.js';
      import { remap, trackStage } from '/scroll-stage.js';
      await document.fonts.ready;
      const manifest = {
        base: '/frames', count: ${FRAME_COUNT}, pattern: 'frame-%03d.png',
        width: 160, height: 90, version: ${JSON.stringify(scenario)},
      };
      // Exactly what CinematicHero does: one tracker per stage, feeding the
      // player and publishing the same custom properties onto the stage.
      window.startPlayer = () => {
        const section = document.querySelector('.v-cine');
        const stage = document.querySelector('.v-cine-stage');
        const player = startScrollSequence(document.querySelector('canvas'), manifest);
        const tracker = trackStage(section, stage, (progress, reduced) => {
          stage.style.setProperty('--v-progress', progress.toFixed(4));
          stage.style.setProperty('--v-exit', reduced ? '0' : remap(progress, 0.84, 1).toFixed(4));
          player.setPreload(!reduced);
          player.setProgress(progress);
        });
        return () => { tracker.stop(); player.stop(); };
      };
      window.stopPlayer = window.startPlayer();
      window.fixtureReady = true;
    </script></body></html>`;
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    if (url.pathname === "/vocational.css") {
      response.writeHead(200, { "Content-Type": "text/css" }).end(css);
    } else if (modules[url.pathname]) {
      response.writeHead(200, { "Content-Type": "text/javascript" }).end(modules[url.pathname]);
    } else if (url.pathname.startsWith("/fonts/")) {
      const font = fonts.find(([name]) => url.pathname === `/fonts/${name}`)?.[1];
      response.writeHead(font ? 200 : 404, { "Content-Type": "font/woff2" }).end(font);
    } else if (/^\/frames\/frame-\d{3}\.png$/.test(url.pathname)) {
      const frame = Number(url.pathname.match(/(\d{3})\.png$/)[1]);
      const scenario = [...url.searchParams.values()][0] || "normal";
      const entries = requests.get(scenario) || [];
      entries.push(frame);
      requests.set(scenario, entries);
      if (scenario === "late" && frame === 100) {
        slowResponses.add(scenario);
        await delay(1200);
        slowResponses.delete(scenario);
      }
      if (scenario === "missing" && frame === 76) {
        response.writeHead(404).end();
      } else {
        response
          .writeHead(200, { "Content-Type": "image/png", "Cache-Control": "no-store" })
          .end(frames[frame - 1]);
      }
    } else if (url.pathname === "/") {
      response
        .writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
        .end(fixture(url.searchParams.get("scenario") || "normal"));
    } else {
      response.writeHead(404).end();
    }
  } catch (error) {
    response.writeHead(500).end(String(error));
  }
});

async function executablePath() {
  if (process.env.SCROLL_TEST_CHROMIUM) return process.env.SCROLL_TEST_CHROMIUM;
  if (existsSync(chromium.executablePath())) return chromium.executablePath();
  if (process.platform === "win32" && process.env.LOCALAPPDATA) {
    const cache = join(process.env.LOCALAPPDATA, "ms-playwright");
    const versions = (await readdir(cache)).filter((name) => /^chromium-\d+$/.test(name));
    versions.sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
    for (const version of versions) {
      const candidate = join(cache, version, "chrome-win64/chrome.exe");
      if (existsSync(candidate)) return candidate;
    }
  }
  throw new Error("Chromium missing. Run pnpm exec playwright install chromium first.");
}

async function openFixture(browser, scenario, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.rafCalls = 0;
    window.drawCalls = 0;
    const request = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => {
      window.rafCalls += 1;
      return request(callback);
    };
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      window.drawCalls += 1;
      return draw.apply(this, args);
    };
  });
  await page.goto(`${base}/?scenario=${scenario}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.fixtureReady === true);
  return { context, page, errors };
}

async function scrollToProgress(page, progress) {
  await page.evaluate((value) => {
    const section = document.querySelector(".v-cine");
    const stage = document.querySelector(".v-cine-stage");
    const rect = section.getBoundingClientRect();
    window.scrollTo({
      top: window.scrollY + rect.top + (rect.height - stage.getBoundingClientRect().height) * value,
      behavior: "instant",
    });
  }, progress);
}

async function expectFrame(page, frame, description) {
  await page.waitForFunction(
    ({ expected, color }) => {
      const canvas = document.querySelector("canvas");
      if (Number(canvas.dataset.frame) !== expected || !canvas.width || !canvas.height)
        return false;
      const pixels = canvas
        .getContext("2d")
        .getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
      return color.every((channel, index) => pixels[index] === channel);
    },
    { expected: frame, color: frameColor(frame) },
    { timeout: 10_000 },
  );
  console.log(`PASS ${description}: frame ${String(frame).padStart(3, "0")} pixels`);
}

async function assertBackingSize(page, dpr) {
  const result = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const rect = canvas.getBoundingClientRect();
    return {
      width: canvas.width,
      height: canvas.height,
      cssWidth: rect.width,
      cssHeight: rect.height,
    };
  });
  assert.equal(result.width, Math.round(result.cssWidth * dpr), "DPR backing width");
  assert.equal(result.height, Math.round(result.cssHeight * dpr), "DPR backing height");
}

async function assertContentNotClipped(page) {
  const result = await page.evaluate(() => {
    const stage = document.querySelector(".v-cine-stage").getBoundingClientRect();
    const nodes = [...document.querySelectorAll(".v-cine-title, .v-cine-action, .v-cine-cue")];
    const clipped = nodes.filter((node) => {
      const rect = node.getBoundingClientRect();
      return (
        rect.left < stage.left - 1 || rect.right > stage.right + 1 || rect.bottom > stage.bottom + 1
      );
    });
    return {
      clipped: clipped.map((node) => node.textContent.trim()),
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });
  assert.deepEqual(result.clipped, [], "Hero text and buttons must stay inside their stage");
  assert.equal(result.pageWidth, result.viewportWidth, "No horizontal overflow");
}

let browser;
try {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ executablePath: await executablePath(), headless: true });

  const normal = await openFixture(browser, "normal", { deviceScaleFactor: 2 });
  await expectFrame(normal.page, 1, "initial render");
  await assertBackingSize(normal.page, 2);
  for (const progress of [0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25, 0]) {
    await scrollToProgress(normal.page, progress);
    await expectFrame(
      normal.page,
      Math.round((FRAME_COUNT - 1) * progress) + 1,
      `scroll ${progress * 100}%`,
    );
  }
  for (const progress of [1, 0, 0.8, 0.1, 1]) await scrollToProgress(normal.page, progress);
  // Flush queued scroll events before inspecting a possibly still-visible old endpoint.
  await normal.page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await expectFrame(normal.page, FRAME_COUNT, "rapid jumps converge");
  const idleBefore = await normal.page.evaluate(() => ({
    raf: window.rafCalls,
    frame: document.querySelector("canvas").dataset.frame,
  }));
  await delay(250);
  const idleAfter = await normal.page.evaluate(() => ({
    raf: window.rafCalls,
    frame: document.querySelector("canvas").dataset.frame,
  }));
  assert.equal(idleAfter.frame, idleBefore.frame, "Idle time must not advance frames");
  assert.ok(idleAfter.raf > idleBefore.raf, "Persistent rAF loop must continue after settling");
  await scrollToProgress(normal.page, 0);
  await expectFrame(normal.page, 1, "return to start before resize");
  const drawsBeforeResize = await normal.page.evaluate(() => window.drawCalls);
  await normal.page.setViewportSize({ width: 1280, height: 800 });
  await normal.page.waitForFunction((count) => window.drawCalls > count, drawsBeforeResize);
  await expectFrame(normal.page, 1, "resize with unchanged frame");
  await assertBackingSize(normal.page, 2);
  await normal.page.evaluate(() => window.stopPlayer());
  const stopped = await normal.page.evaluate(() => window.rafCalls);
  await normal.page.evaluate(() => window.scrollTo(0, 400));
  await delay(200);
  assert.equal(
    await normal.page.evaluate(() => window.rafCalls),
    stopped,
    "Cleanup stops the loop",
  );
  await normal.page.evaluate(() => {
    window.stopPlayer = window.startPlayer();
  });
  await scrollToProgress(normal.page, 1);
  await expectFrame(normal.page, FRAME_COUNT, "restart after cleanup");
  assert.deepEqual(normal.errors, []);
  await normal.context.close();

  const late = await openFixture(browser, "late");
  await scrollToProgress(late.page, 99 / (FRAME_COUNT - 1));
  await delay(250);
  assert.ok(slowResponses.has("late"), "Frame 100 response is deliberately still pending");
  assert.notEqual(await late.page.locator("canvas").getAttribute("data-frame"), "100");
  await expectFrame(late.page, 100, "late frame converges without another scroll event");
  assert.deepEqual(late.errors, []);
  await late.context.close();

  const missing = await openFixture(browser, "missing");
  await expectFrame(missing.page, 1, "missing-image fixture starts");
  await scrollToProgress(missing.page, 0.5);
  await delay(1000);
  const retained = await missing.page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    return {
      frame: Number(canvas.dataset.frame),
      alpha: canvas.getContext("2d").getImageData(0, 0, 1, 1).data[3],
    };
  });
  assert.ok(retained.frame > 1 && retained.frame !== 76, "Failed frame uses another loaded image");
  assert.equal(retained.alpha, 255, "Failed frame does not blank the canvas");
  await scrollToProgress(missing.page, 1);
  await expectFrame(missing.page, FRAME_COUNT, "playback continues after failed frame");
  assert.deepEqual(missing.errors, []);
  await missing.context.close();

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    const mobile = await openFixture(browser, `viewport-${viewport.width}`, { viewport });
    await expectFrame(mobile.page, 1, `${viewport.width}×${viewport.height} first frame`);
    await assertContentNotClipped(mobile.page);
    await scrollToProgress(mobile.page, 1);
    await expectFrame(mobile.page, FRAME_COUNT, `${viewport.width}×${viewport.height} endpoint`);
    await assertContentNotClipped(mobile.page);
    assert.deepEqual(mobile.errors, []);
    await mobile.context.close();
  }

  const reduced = await openFixture(browser, "reduced", { reducedMotion: "reduce" });
  await expectFrame(reduced.page, 1, "initial reduced motion poster");
  await delay(250);
  assert.deepEqual(
    [...new Set(requests.get("reduced"))],
    [1],
    "Reduced motion fetches only frame 1",
  );
  await reduced.page.evaluate(() => window.scrollTo(0, 300));
  await delay(150);
  await expectFrame(reduced.page, 1, "reduced motion ignores scrolling");
  await reduced.page.emulateMedia({ reducedMotion: "no-preference" });
  await scrollToProgress(reduced.page, 1);
  await expectFrame(reduced.page, FRAME_COUNT, "motion preference can enable playback");
  await reduced.page.emulateMedia({ reducedMotion: "reduce" });
  await expectFrame(reduced.page, 1, "motion preference restores static poster");
  assert.deepEqual(reduced.errors, []);
  await reduced.context.close();
  console.log(
    "All scroll-sequence browser checks passed. No production assets or database were used.",
  );
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}

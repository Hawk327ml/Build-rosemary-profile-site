/**
 * Capture ~15s Rosemary hero slider loop for portfolio card.
 * Usage: node scripts/capture-cover.mjs http://127.0.0.1:4180
 */
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const portfolioThumbs = path.resolve(
  root,
  "..",
  "..",
  "Hawk327ml.github.io",
  "public",
  "thumbs",
);
const outLocal = path.join(root, "public", "thumbs", "rosemary.webm");
const outPortfolio = path.join(portfolioThumbs, "rosemary.webm");
const requestedUrl = process.argv[2];
const FPS = 12;
const DURATION_SEC = 15;
const FRAME_COUNT = FPS * DURATION_SEC;

const require = createRequire(import.meta.url);
const portfolioNode = path.resolve(root, "..", "..", "Hawk327ml.github.io", "node_modules");

function loadTool(name) {
  try {
    return require(name);
  } catch {
    return require(path.join(portfolioNode, name));
  }
}

const { chromium } = loadTool("playwright");
const ffmpegInstaller = loadTool("@ffmpeg-installer/ffmpeg");

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: false });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited ${code}`));
    });
  });
}

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server not ready: ${url}`);
}

async function startPreview() {
  const preview = spawn(
    "npx",
    ["--yes", "serve", "public", "-l", "4180"],
    { cwd: root, stdio: "ignore", shell: true },
  );
  const base = "http://127.0.0.1:4180";
  await waitForServer(base);
  return { base, stop: () => preview.kill("SIGTERM") };
}

async function main() {
  let stopPreview = null;
  let base = requestedUrl;
  if (!base) {
    const preview = await startPreview();
    base = preview.base;
    stopPreview = preview.stop;
  }

  const frameDir = await mkdtemp(path.join(tmpdir(), "rose-frames-"));
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  try {
    await page.goto(`${base.replace(/\/$/, "")}/?cap=${Date.now()}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForSelector(".hero-slide.is-active img", { timeout: 30000 });
    await page.waitForTimeout(800);

    await page.addStyleTag({
      content: `
        .site-header, .skip-link, .audio-widget, footer, .auth-section,
        #profile, #benefits, #grow, #checklist, #calendar, #faq { display: none !important; }
        .hero { min-height: 100vh !important; padding: 2rem !important; }
      `,
    });

    const interval = 1000 / FPS;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const t0 = Date.now();
      // Nudge slider every ~5s to match site autoplay feel.
      if (i > 0 && i % 60 === 0) {
        await page.locator("#next-slide").click().catch(() => {});
      }
      const file = path.join(frameDir, `frame_${String(i).padStart(4, "0")}.png`);
      await page.screenshot({ path: file, type: "png" });
      const spent = Date.now() - t0;
      if (spent < interval) await page.waitForTimeout(interval - spent);
    }
  } finally {
    await browser.close();
    if (stopPreview) stopPreview();
  }

  await mkdir(path.dirname(outLocal), { recursive: true });
  await run(ffmpegInstaller.path, [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    path.join(frameDir, "frame_%04d.png"),
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "1M",
    "-an",
    "-pix_fmt",
    "yuv420p",
    outLocal,
  ]);
  await rm(frameDir, { recursive: true, force: true });

  try {
    await mkdir(path.dirname(outPortfolio), { recursive: true });
    await copyFile(outLocal, outPortfolio);
    console.log(`Also copied to ${outPortfolio}`);
  } catch (err) {
    console.warn("Portfolio copy skipped:", err.message);
  }
  console.log(`Wrote ${outLocal}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

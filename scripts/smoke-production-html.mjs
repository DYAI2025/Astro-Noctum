#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const urlArgIndex = args.findIndex((arg) => arg === "--url" || arg === "-u");
const explicitUrl = urlArgIndex >= 0 ? args[urlArgIndex + 1] : null;
const baseUrl = explicitUrl || process.env.SMOKE_URL || process.env.PRODUCTION_URL || null;

const hasDevEntrypoint = (html) => /\/src\/main\.tsx(?:["'?]|$)/.test(html);
const hasBuiltScript = (html) => /<script\b[^>]+src=["']\/assets\/[^"']+\.js[^"']*["'][^>]*>/i.test(html);
const hasBuiltStylesheet = (html) => /<link\b[^>]+rel=["']stylesheet["'][^>]+href=["']\/assets\/[^"']+\.css[^"']*["'][^>]*>/i.test(html);

function assertProductionHtml(html, label) {
  const checks = [
    [!hasDevEntrypoint(html), "must not reference /src/main.tsx"],
    [hasBuiltScript(html), "must reference generated /assets/*.js"],
    [hasBuiltStylesheet(html), "must reference generated /assets/*.css"],
  ];
  const failures = checks.filter(([ok]) => !ok).map(([, message]) => message);

  if (failures.length > 0) {
    throw new Error(`${label} is not production Vite HTML:\n- ${failures.join("\n- ")}`);
  }
}

async function readLocalDistHtml() {
  const distIndex = path.resolve("dist", "index.html");
  const html = await fs.readFile(distIndex, "utf8");
  assertProductionHtml(html, distIndex);
  console.log(`[smoke] ${distIndex} references built Vite assets and no /src/main.tsx entrypoint.`);
}

async function fetchHtml(url) {
  const response = await fetch(url, { redirect: "follow" });
  const html = await response.text();
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }
  if (!contentType.toLowerCase().includes("text/html")) {
    throw new Error(`${url} returned non-HTML content-type: ${contentType || "<missing>"}`);
  }

  return html;
}

async function fetchProductionHtml() {
  const rootUrl = new URL("/", baseUrl).toString();
  const nestedUrl = new URL("/dashboard", baseUrl).toString();
  const rootHtml = await fetchHtml(rootUrl);
  const nestedHtml = await fetchHtml(nestedUrl);

  assertProductionHtml(rootHtml, rootUrl);
  assertProductionHtml(nestedHtml, nestedUrl);
  console.log(`[smoke] ${rootUrl} serves built Vite HTML.`);
  console.log(`[smoke] ${nestedUrl} returns the SPA index fallback.`);
}

try {
  if (baseUrl) {
    await fetchProductionHtml();
  } else {
    await readLocalDistHtml();
    console.log("[smoke] Set SMOKE_URL=https://bazodiac.space to validate deployed production HTML and /dashboard fallback.");
  }
} catch (error) {
  console.error(`[smoke] ${error.message}`);
  process.exit(1);
}

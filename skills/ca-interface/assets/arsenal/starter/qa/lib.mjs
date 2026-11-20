import { chromium, devices } from "playwright-core";
import { fileURLToPath } from "node:url";
export const BASE = "http://localhost:4400";
export const CAP = fileURLToPath(new URL("./cap/", import.meta.url));
export const log = [];
export function nota(...a){ const s = `[${new Date().toTimeString().slice(0,8)}] ` + a.join(" "); console.log(s); log.push(s); }
export async function abrir() {
  return chromium.launch({ channel: "chrome", headless: true });
}
// escala 1 nas capturas para economizar (o DPR real fica no descritor quando dpr:true)
export async function ctx(browser, tipo, extra = {}) {
  let o;
  if (tipo === "iphone") o = { ...devices["iPhone 13"] };
  else if (tipo === "pixel") o = { ...devices["Pixel 7"] };
  else if (tipo === "ipad") o = { ...devices["iPad (gen 7)"] };
  else if (tipo === "d1440") o = { viewport: { width: 1440, height: 900 } };
  else o = { viewport: { width: 1280, height: 800 } };
  delete o.defaultBrowserType;
  const { abertura, dpr, aparencia, ...resto } = extra;
  if (!dpr && o.deviceScaleFactor) o.deviceScaleFactor = 2;
  const c = await browser.newContext({ ...o, locale: "pt-BR", ...resto });
  if (!abertura) await c.addInitScript(() => { try { sessionStorage.setItem("proto-abertura-vista", "1"); localStorage.setItem("proto-abertura-vista", "1") } catch {} });
  return c;
}
export function vigiar(page, nome) {
  page.on("console", m => { if (m.type() === "error") nota(`CONSOLE[${nome}]`, m.text().slice(0, 200)); });
  page.on("pageerror", e => nota(`PAGEERROR[${nome}]`, e.message.slice(0, 200)));
}
export async function cap(page, nome, full = false) {
  await page.screenshot({ path: CAP + nome + ".png", fullPage: full, scale: "css" });
  nota("cap", nome);
}
export async function ir(page, url, espera = 1200) {
  await page.goto(BASE + url, { waitUntil: "load" }).catch(e => nota("goto falhou", url, e.message.slice(0,100)));
  await page.waitForTimeout(espera);
}

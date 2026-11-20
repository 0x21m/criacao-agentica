import { abrir, ctx, ir } from "./lib.mjs";
const b = await abrir(); const c = await ctx(b, "d1440"); const p = await c.newPage();
for (const u of process.argv.slice(2)) {
  await ir(p, u, 5000);
  const r = await p.evaluate(() => [...document.querySelectorAll("button,[role=button],a,input,select,[role=tab],[role=switch],[role=combobox],[role=menuitem]")].filter(e=>e.offsetParent!==null).map(e => `${e.tagName.toLowerCase()}${e.getAttribute("role")?"["+e.getAttribute("role")+"]":""} "${(e.getAttribute("aria-label")||e.innerText||e.placeholder||e.value||"").trim().replace(/\s+/g," ").slice(0,50)}"`));
  console.log("==", u); console.log([...new Set(r)].join("\n"));
}
await b.close();

import { transformSync } from 'esbuild/lib/main.js';
import { readFileSync } from 'fs';
export async function load(url, ctx, next) {
  if (url.endsWith('.jsx') || (url.includes('/src/campus/') && url.endsWith('.js'))) {
    const src = readFileSync(new URL(url), 'utf8');
    const out = transformSync(src, { loader: 'jsx', jsx: 'automatic', format: 'esm' });
    return { format: 'module', source: out.code, shortCircuit: true };
  }
  return next(url, ctx);
}
export async function resolve(spec, ctx, next) {
  try { return await next(spec, ctx); } catch (e) {
    if (spec.startsWith('.') && !/\.\w+$/.test(spec)) { for (const ext of ['.jsx', '.js']) { try { return await next(spec + ext, ctx); } catch {} } }
    throw e;
  }
}

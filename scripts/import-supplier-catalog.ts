/**
 * Supplier catalogue import.
 *
 * WHY THIS EXISTS
 * Oct 2026: the owner asked for the full catalogues of the brands the shop fits
 * (Nitrous Express, BlackBoost, Italian RP, VR Speed Factory, MHD, bootmod3) to be
 * listed in the store. The crawl itself runs off-box; it produces one
 * normalised JSON file per supplier (`<site>.norm.json`, schema below). This
 * script turns those files into products. The Excel sheets in
 * docs/supplier-catalogs/ are generated from the same files.
 *
 * WHAT IT GUARANTEES
 *  - Idempotent: product ids are deterministic (`sup-<brand>-<hash of the
 *    supplier's own product id>`), so a re-run UPDATES prices, stock, text and
 *    images instead of duplicating, and never touches hand-made products.
 *  - Never steals a slug: if another product already owns a slug the import
 *    appends -2, -3, … rather than overwriting it.
 *  - Images are copied to UPLOAD_DIR (the CSP allows same-origin images only and
 *    next.config has no remotePatterns, so supplier CDN URLs would not render).
 *    Bytes are sniffed — only JPEG/PNG/WebP are kept, the same allowlist as the
 *    admin upload route.
 *  - featured / rating / reviewCount / badge are left alone on update; those are
 *    the shop's own merchandising.
 *  - Products with no price (call-for-price, $0) are skipped, not listed at $0.
 *
 * USAGE (on the server, from APP_DIR, as the app user)
 *   npx tsx scripts/import-supplier-catalog.ts --dry-run /tmp/pt-import/*.norm.json
 *   npx tsx scripts/import-supplier-catalog.ts /tmp/pt-import/*.norm.json
 *   npx tsx scripts/import-supplier-catalog.ts --remove=bb      # delete every sup-bb-* product
 * Writes a result map (id → slug, status) next to each input as <file>.result.json.
 */
import 'dotenv/config';
import { createHash } from 'crypto';
import { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/db/prisma';
import { getCategories, createCategory } from '@/lib/categories';

interface NormRecord {
  id: string;
  source: string;
  brand: string;
  sourceUrl: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  price: number | null;
  oldPrice: number | null;
  inStock: boolean;
  purchasable: boolean;
  shortDescription: string;
  description: string;
  images: string[];
  specs: { label: string; value: string }[];
  compatibility: string[];
}

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'public', 'products', 'uploads');
const UPLOAD_PUBLIC_PATH = (process.env.UPLOAD_PUBLIC_PATH ?? '/products/uploads').replace(/\/+$/, '');
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const UA = 'Mozilla/5.0 (compatible; ProTuningCatalogImport/1.0; +https://protuningshop.com)';
const DEFAULT_COLORS = { visualColor: '#00d4ff', visualColor2: '#003d99' };

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const removeArg = args.find((a) => a.startsWith('--remove='));
const files = args.filter((a) => !a.startsWith('--'));

function sniff(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

/** Download once per URL; the file name is a hash of the URL so re-runs reuse it. */
async function localImage(url: string): Promise<string | null> {
  const stem = 'product-' + createHash('sha1').update(url).digest('hex').slice(0, 16);
  for (const ext of ['jpg', 'png', 'webp']) {
    if (existsSync(join(UPLOAD_DIR, `${stem}.${ext}`))) return `${UPLOAD_PUBLIC_PATH}/${stem}.${ext}`;
  }
  if (dryRun) return `${UPLOAD_PUBLIC_PATH}/${stem}.jpg`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'image/jpeg,image/png,image/webp,*/*;q=0.5' }, signal: AbortSignal.timeout(30_000) });
      if (!res.ok) { if (res.status >= 500 || res.status === 429) continue; return null; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX_IMAGE_BYTES) return null;
      const ext = sniff(buf);
      if (!ext) return null;
      await writeFile(join(UPLOAD_DIR, `${stem}.${ext}`), buf);
      return `${UPLOAD_PUBLIC_PATH}/${stem}.${ext}`;
    } catch {
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  return null;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]); }
  }));
  return out;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function ensureCategories(names: string[]) {
  const existing = new Set((await getCategories()).map((c) => c.name));
  for (const name of [...new Set(names)]) {
    if (existing.has(name)) continue;
    console.log(`category: creating "${name}"`);
    if (!dryRun) await createCategory({ name, slug: slugify(name), description: undefined });
  }
}

async function remove(short: string) {
  const prefix = `sup-${short}-`;
  const n = await prisma.product.count({ where: { id: { startsWith: prefix } } });
  console.log(`${dryRun ? '[dry-run] would delete' : 'deleting'} ${n} products with id ${prefix}*`);
  if (!dryRun) await prisma.product.deleteMany({ where: { id: { startsWith: prefix } } });
}

async function importFile(file: string, slugOwner: Map<string, string>) {
  const records: NormRecord[] = JSON.parse(await readFile(file, 'utf8'));
  const result: Record<string, { slug?: string; status: string }> = {};
  const sellable = records.filter((r) => {
    const ok = r.purchasable && typeof r.price === 'number' && r.price > 0;
    if (!ok) result[r.id] = { status: 'skipped: no price' };
    return ok;
  });
  await ensureCategories(sellable.map((r) => r.category));

  let created = 0, updated = 0, imgs = 0, imgFail = 0, done = 0;
  await mapLimit(sellable, 6, async (r) => {
    const images = (await Promise.all(r.images.map(localImage))).filter((x): x is string => !!x);
    imgs += images.length;
    imgFail += r.images.length - images.length;

    const existing = await prisma.product.findUnique({ where: { id: r.id }, select: { slug: true } });
    let slug = existing?.slug ?? r.slug;
    if (!existing) {
      for (let n = 2; slugOwner.has(slug) && slugOwner.get(slug) !== r.id; n++) slug = `${r.slug}-${n}`;
      slugOwner.set(slug, r.id);
    }
    const data = {
      name: r.name.slice(0, 400),
      category: r.category,
      shortDescription: r.shortDescription,
      description: r.description,
      price: r.price as number,
      oldPrice: r.oldPrice ?? null,
      currency: 'USD',
      inStock: r.inStock,
      specs: JSON.stringify(r.specs),
      compatibility: JSON.stringify(r.compatibility),
      images: JSON.stringify(images),
    };
    if (!dryRun) {
      if (existing) await prisma.product.update({ where: { id: r.id }, data });
      else await prisma.product.create({ data: { id: r.id, slug, ...data, includedItems: '[]', featured: false, rating: 0, reviewCount: 0, ...DEFAULT_COLORS } });
    }
    if (existing) updated++;
    else created++;
    result[r.id] = { slug, status: existing ? 'updated' : 'created' };
    if (++done % 100 === 0) console.log(`  ${file}: ${done}/${sellable.length}`);
  });
  console.log(`${dryRun ? '[dry-run] ' : ''}${file}: ${created} created, ${updated} updated, ${records.length - sellable.length} skipped (no price); images ${imgs} ok, ${imgFail} failed`);
  if (!dryRun) await writeFile(file.replace(/\.json$/, '') + '.result.json', JSON.stringify(result));
}

async function main() {
  if (removeArg) return remove(removeArg.split('=')[1]);
  if (!files.length) throw new Error('no input files');
  if (!dryRun) await mkdir(UPLOAD_DIR, { recursive: true });
  const slugOwner = new Map((await prisma.product.findMany({ select: { slug: true, id: true } })).map((p) => [p.slug, p.id]));
  for (const f of files) await importFile(f, slugOwner);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });

// Turns an original picture from media-src/ into the two WebP sizes the site uses.
//
//   node scripts/optimize-image.mjs <input> <project> <name> [--crop left,top,width,height] [--gray]
//
// Writes public/images/<project>/<name>-960.webp (page, carousel; quality 78) and <name>-1920.webp (viewer; quality 82).
// The number is the longest side in pixels, so landscape and portrait pictures both fit. Originals are never
// enlarged. `--crop` takes pixels of the original and is applied first; `--gray` drops the colors.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const positional = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const [input, project, name] = positional;

if (!input || !project || !name) {
  console.error('Usage: node scripts/optimize-image.mjs <input> <project> <name> [--crop l,t,w,h] [--gray]');
  process.exit(1);
}

const outDir = join('public', 'images', project);
await mkdir(outDir, { recursive: true });

for (const [size, quality] of [[960, 78], [1920, 82]]) {
  let image = sharp(input).rotate();
  const crop = option('--crop');
  if (crop) {
    const [left, top, width, height] = crop.split(',').map(Number);
    image = image.extract({ left, top, width, height });
  }
  if (flag('--gray')) image = image.grayscale();
  const file = join(outDir, `${name}-${size}.webp`);
  const info = await image.resize(size, size, { fit: 'inside', withoutEnlargement: true }).webp({ quality }).toFile(file);
  console.log(`${file}  ${info.width}x${info.height}  ${Math.round(info.size / 1024)} KB`);
}

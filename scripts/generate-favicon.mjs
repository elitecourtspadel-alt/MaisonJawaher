import sharp from 'sharp';

// Reuse the exact logo alpha mask; place the cream emblem on the brand burgundy.
const size = 512;
const logo = await sharp('public/logo.png').resize(310, 412, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < logo.data.length; i += 4) {
  logo.data[i] = 247; logo.data[i + 1] = 236; logo.data[i + 2] = 221;
}
const emblem = await sharp(logo.data, { raw: { width: logo.info.width, height: logo.info.height, channels: 4 } }).png().toBuffer();
const square = await sharp({ create: { width: size, height: size, channels: 4, background: '#541027' } })
  .composite([{ input: emblem, gravity: 'centre' }]).png().toBuffer();
for (const [name, width] of [['favicon-32.png', 32], ['favicon-192.png', 192], ['apple-touch-icon.png', 180]]) {
  await sharp(square).resize(width, width).png().toFile(`public/${name}`);
}

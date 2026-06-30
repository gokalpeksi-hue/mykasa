// MyKasa logo/ikon üreteci — saf Node (zlib). Yeşil madeni para üzerinde ₺ (kasa amblemi).
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const SS = 4; // süper-örnekleme (yumuşak kenar)

// ---- PNG kodlayıcı ----
const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t;
})();
function crc32(buf) { let c = ~0; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return ~c >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const cd = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(cd));
  return Buffer.concat([len, cd, crc]);
}
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---- Geometri yardımcıları (512 referans uzayı) ----
function lerp(a, b, t) { return a + (b - a) * t; }
function mix(c1, c2, t) { return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]; }
function inRoundRect(px, py, x, y, w, h, r) {
  if (px < x || px > x + w || py < y || py > y + h) return false;
  const rx = Math.min(Math.max(px, x + r), x + w - r), ry = Math.min(Math.max(py, y + r), y + h - r);
  const dx = px - rx, dy = py - ry; return dx * dx + dy * dy <= r * r;
}
function inCircle(px, py, cx, cy, r) { const dx = px - cx, dy = py - cy; return dx * dx + dy * dy <= r * r; }
function ring(px, py, cx, cy, r, w) { const d = Math.hypot(px - cx, py - cy); return d <= r && d >= r - w; }
function inRotRect(px, py, cx, cy, len, thick, angDeg) {
  const a = angDeg * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a);
  const dx = px - cx, dy = py - cy, lx = dx * cs + dy * sn, ly = -dx * sn + dy * cs;
  return Math.abs(lx) <= len / 2 && Math.abs(ly) <= thick / 2;
}
// ₺ amblemi (madeni para içine ortalanmış, ~0.72 ölçek)
function inLira(ux, uy) {
  return inRotRect(ux, uy, 244.5, 262.5, 209, 40, 90) ||   // dikey gövde
         inRotRect(ux, uy, 222.9, 179.7, 68, 37, 40) ||    // üst sol ayak
         inRotRect(ux, uy, 260.3, 221.4, 133, 36, -20) ||  // üst çapraz çubuk
         inRotRect(ux, uy, 251.7, 260.3, 133, 36, -20);    // alt çapraz çubuk
}

function buildIcon(size, maskable) {
  const big = size * SS, S = big / 512;
  const buf = Buffer.alloc(big * big * 4);
  const top = [0x34, 0xe0, 0x8a], bot = [0x07, 0x96, 0x90]; // yeşil → teal
  const lira = [0x0a, 0x7a, 0x55];                          // ₺ rengi (koyu yeşil)
  const corner = maskable ? 0 : 100 * S;
  const coinR = 152, coinC = 256;
  for (let y = 0; y < big; y++) for (let x = 0; x < big; x++) {
    const ux = x / S, uy = y / S;
    const bg = maskable ? true : inRoundRect(x, y, 0, 0, big - 1, big - 1, corner);
    let r, g, b, a;
    if (!bg) { a = 0; r = g = b = 0; }
    else {
      const c = mix(top, bot, uy / 512); r = c[0]; g = c[1]; b = c[2]; a = 255;
      if (inCircle(ux, uy, coinC, coinC, coinR)) {
        if (ring(ux, uy, coinC, coinC, coinR, 13)) { r = 0xe9; g = 0xfb; b = 0xf2; } // ince kenar halkası
        else if (inLira(ux, uy)) { r = lira[0]; g = lira[1]; b = lira[2]; }           // ₺ (koyu yeşil)
        else { r = 0xff; g = 0xff; b = 0xff; }                                        // para yüzü (beyaz)
      }
    }
    const o = (y * big + x) * 4;
    buf[o] = r | 0; buf[o + 1] = g | 0; buf[o + 2] = b | 0; buf[o + 3] = a;
  }
  // SS küçültme → antialias
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let R = 0, G = 0, B = 0, A = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const o = ((y * SS + sy) * big + (x * SS + sx)) * 4, al = buf[o + 3];
      R += buf[o] * al; G += buf[o + 1] * al; B += buf[o + 2] * al; A += al;
    }
    const n = SS * SS, o = (y * size + x) * 4;
    out[o] = A ? Math.round(R / A) : 0; out[o + 1] = A ? Math.round(G / A) : 0;
    out[o + 2] = A ? Math.round(B / A) : 0; out[o + 3] = Math.round(A / n);
  }
  return encodePNG(size, size, out);
}

const dir = __dirname;
fs.writeFileSync(path.join(dir, 'icon-192.png'), buildIcon(192, false));
fs.writeFileSync(path.join(dir, 'icon-512.png'), buildIcon(512, false));
fs.writeFileSync(path.join(dir, 'icon-maskable.png'), buildIcon(512, true));
console.log('icons written:', fs.readdirSync(dir).filter(f => f.endsWith('.png')));

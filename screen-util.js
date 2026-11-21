'use strict';
// Pure helpers for the screen tools (kept free of Electron so they can be unit-tested anywhere).
const clamp = (n, a, b) => Math.min(Math.max(n, a), b);
// A drag rectangle (in screenshot pixels) clamped to the image, at least 1x1.
function clampRect(r, W, H) {
  const x = clamp(Math.round(r.x), 0, W - 1), y = clamp(Math.round(r.y), 0, H - 1);
  return { x, y, w: clamp(Math.round(r.w), 1, W - x), h: clamp(Math.round(r.h), 1, H - y) };
}
// Colour of one pixel of a BGRA bitmap as 0xRRGGBB (the format AutoHotkey uses).
function colorAt(bm, W, H, x, y) {
  x = clamp(Math.round(x), 0, W - 1); y = clamp(Math.round(y), 0, H - 1);
  const i = (y * W + x) * 4;
  return '0x' + [bm[i + 2], bm[i + 1], bm[i]].map(n => n.toString(16).padStart(2, '0')).join('').toUpperCase();
}
// Top-left of a display in physical screen pixels (what AutoHotkey's coordinates use).
function originOf(d, isWin, dipToScreen) {
  const sf = d.scaleFactor || 1;
  return isWin && dipToScreen ? dipToScreen({ x: d.bounds.x, y: d.bounds.y }) : { x: Math.round(d.bounds.x * sf), y: Math.round(d.bounds.y * sf) };
}
module.exports = { clamp, clampRect, colorAt, originOf };

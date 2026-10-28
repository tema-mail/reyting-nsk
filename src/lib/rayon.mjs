// Район Новосибирска по координатам: точка в полигоне границ OpenStreetMap (src/data/rayony.json, снято один раз 28.10.2026).
// Вне всех десяти районов – «за городом».
import data from '../data/rayony.json' with { type: 'json' };

export const ZA_GORODOM = 'За городом';
export const RAYONY = data.районы.map((r) => r.name);

function inRing([x, y], ring) {
  let ins = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
const inPoly = (pt, rings) => inRing(pt, rings[0]) && !rings.slice(1).some((h) => inRing(pt, h));

/** [долгота, широта] → название района («Центральный») или «За городом». */
export function rayon(pt) {
  for (const r of data.районы) {
    const g = r.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    if (polys.some((p) => inPoly(pt, p))) return r.name;
  }
  return ZA_GORODOM;
}

/**
 * Stylised sage medallions, drawn as inline SVG.
 *
 * No authentic likeness of these figures survives, so these are deliberately
 * emblematic rather than representational: a meditating silhouette, a halo, and
 * a small attribute glyph naming what each Maharshi is remembered for. Drawn
 * here rather than sourced, so there is nothing to license and nothing that
 * pretends to be a historical portrait.
 */

// Attribute glyphs, drawn inside a 24×24 box centred on (12,12).
const ATTR = {
  kalasha:  '<path d="M8 8h8l-1 2a5 5 0 1 1-6 0L8 8z"/><rect x="7.2" y="6.2" width="9.6" height="2.2" rx="1.1"/><path d="M12 3.4l1.1 1.6h-2.2L12 3.4z"/>',
  scroll:   '<rect x="5.5" y="5" width="13" height="14" rx="1.6"/><path d="M8.5 9h7M8.5 12h7M8.5 15h4.5" stroke="#fffdf6" stroke-width="1.4" stroke-linecap="round" fill="none"/>',
  book:     '<path d="M4.4 5.4h5.6A1.8 1.8 0 0 1 11.3 7v11.6a2.6 2.6 0 0 0-1.6-.7H4.4z"/><path d="M19.6 5.4H14A1.8 1.8 0 0 0 12.7 7v11.6a2.6 2.6 0 0 1 1.6-.7h5.3z"/><path d="M12 7.4v11" stroke="#fffdf6" stroke-width="1" fill="none"/>',
  flame:    '<path d="M12 3c.6 3.2 3.8 4.3 3.8 8a3.8 3.8 0 0 1-7.6 0c0-1.7.8-2.6 1.6-3.6.3 1 .9 1.5 1.5 1.7C11.1 7 12 5.4 12 3z"/><ellipse cx="12" cy="17.8" rx="4.6" ry="2.4" opacity=".45"/>',
  scalpel:  '<path d="M4.8 16.4l7.8-7.8 2.6 2.6-7.8 7.8H4.8z"/><path d="M14.4 9.6l3.4-4.6a1.2 1.2 0 0 1 1.9 1.5l-3.5 4.4z"/>',
  lotus:    '<path d="M12 5.2c1.9 1.9 2.6 4 2.2 6.6-1 .5-1.6 1.2-2.2 2-.6-.8-1.2-1.5-2.2-2-.4-2.6.3-4.7 2.2-6.6z"/><path d="M6.4 9.2c2.4.5 4 1.7 5 3.6-.4 1-.5 1.9-.5 2.9-2-1.1-3.6-2.6-4.5-6.5z"/><path d="M17.6 9.2c-2.4.5-4 1.7-5 3.6.4 1 .5 1.9.5 2.9 2-1.1 3.6-2.6 4.5-6.5z"/><ellipse cx="12" cy="17.6" rx="6.2" ry="1.6" opacity=".4"/>',
  crucible: '<path d="M6.6 8.4h10.8l-1.4 8.2a2 2 0 0 1-2 1.7h-4a2 2 0 0 1-2-1.7L6.6 8.4z"/><rect x="5.4" y="6.4" width="13.2" height="2.2" rx="1.1"/><path d="M12 2.6c.5 1.4 1.7 1.8 1.7 3a1.7 1.7 0 0 1-3.4 0c0-1.2 1.2-1.6 1.7-3z" opacity=".55"/>',
  mortar:   '<path d="M6 10.4h12l-1.3 5.4a3 3 0 0 1-2.9 2.3h-3.6a3 3 0 0 1-2.9-2.3L6 10.4z"/><rect x="4.8" y="8.6" width="14.4" height="1.9" rx=".95"/><rect x="13.4" y="2.6" width="2" height="6" rx="1" transform="rotate(20 14.4 5.6)"/>',
  leaf:     '<path d="M18.6 5.2c.9 6.6-2.6 11.4-7.6 11.4a4.7 4.7 0 0 1-4.7-4.7c0-4.4 5.2-6.6 12.3-6.7z"/><path d="M16.4 7.6C12.5 9 9.4 12.2 7.2 19" stroke="#fffdf6" stroke-width="1.4" stroke-linecap="round" fill="none"/>',
  bowl:     '<path d="M4.6 10.6h14.8a7.4 7.4 0 0 1-7.4 7.4 7.4 7.4 0 0 1-7.4-7.4z"/><rect x="3.6" y="8.8" width="16.8" height="1.9" rx=".95"/><path d="M9.6 6.6c.4-1.2 1.4-1.8 2.4-1.8s2 .6 2.4 1.8" stroke="#fffdf6" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
};

const BEARD = {
  short:  'M34 51 q0 13 16 19 q16 -6 16 -19 q-7 8 -16 8 q-9 0 -16 -8z',
  medium: 'M34 51 q0 20 16 28 q16 -8 16 -28 q-7 8 -16 8 q-9 0 -16 -8z',
  long:   'M33 51 q-1 30 17 40 q18 -10 17 -40 q-7 8 -17 8 q-10 0 -17 -8z',
};

/**
 * @param {{id:string, palette:[string,string], attr:string, beard:string, crown?:boolean}} m
 * @param {number} size rendered px
 */
function portrait(m, size = 96) {
  const [dark, light] = m.palette;
  const gid = `g-${m.id}`;
  const beard = BEARD[m.beard] || BEARD.medium;
  const glyph = ATTR[m.attr] || ATTR.lotus;

  return `
<svg viewBox="0 0 100 100" width="${size}" height="${size}" role="img"
     aria-label="Stylised emblem of ${m.name}" class="mh-portrait">
  <defs>
    <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/>
    </linearGradient>
    <clipPath id="clip-${m.id}"><circle cx="50" cy="50" r="46"/></clipPath>
  </defs>

  <circle cx="50" cy="50" r="48" fill="none" stroke="${light}" stroke-opacity=".45" stroke-width="1"/>
  <circle cx="50" cy="50" r="46" fill="url(#${gid})"/>

  <g clip-path="url(#clip-${m.id})">
    <!-- halo -->
    <circle cx="50" cy="44" r="25" fill="#f4e4b0" fill-opacity=".14"/>
    <circle cx="50" cy="44" r="25" fill="none" stroke="#f4e4b0" stroke-opacity=".32" stroke-width="1"/>
    <!-- shoulders / upper robe -->
    <path d="M50 74 q-30 3 -34 30 h68 q-4 -27 -34 -30z" fill="#f7efdd" fill-opacity=".93"/>
    <path d="M50 76 l-12 28 h24z" fill="${dark}" fill-opacity=".22"/>
    <!-- neck -->
    <rect x="44" y="62" width="12" height="14" rx="5" fill="#e8c9a0"/>
    <!-- face -->
    <ellipse cx="50" cy="48" rx="18" ry="21" fill="#f0d3aa"/>
    <!-- jata (matted hair) -->
    <path d="M50 26 q-19 0 -19 19 q0 -10 6 -13 q-2 8 0 12 q3 -13 13 -14 q10 1 13 14 q2 -4 0 -12 q6 3 6 13 q0 -19 -19 -19z" fill="#3b3227"/>
    <ellipse cx="50" cy="24" rx="7.5" ry="6" fill="#3b3227"/>
    ${m.crown ? '<path d="M39 22 l3 -8 4 5 4 -8 4 8 4 -5 3 8z" fill="#e8c766"/>' : ''}
    <!-- brow, eyes closed in meditation -->
    <path d="M40 44 q4 -2.5 8 0 M52 44 q4 -2.5 8 0" stroke="#5a4633" stroke-width="1.5"
          fill="none" stroke-linecap="round"/>
    <path d="M41 49 q3.5 2.5 7 0 M52 49 q3.5 2.5 7 0" stroke="#5a4633" stroke-width="1.6"
          fill="none" stroke-linecap="round"/>
    <!-- tilaka -->
    <path d="M50 31 v8" stroke="#c9584b" stroke-width="2.4" stroke-linecap="round"/>
    <!-- beard -->
    <path d="${beard}" fill="#4a4034"/>
    <path d="M41 55 q9 5 18 0 q-5 5 -9 5 t-9 -5z" fill="#3f372c"/>
  </g>

  <!-- attribute badge -->
  <circle cx="79" cy="79" r="15" fill="#fffdf6" stroke="${dark}" stroke-width="1.4"/>
  <g transform="translate(67,67)" fill="${dark}" stroke="none">${glyph}</g>
</svg>`.trim();
}

module.exports = { portrait, ATTR };

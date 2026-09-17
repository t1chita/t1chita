export const PALETTES = {
  light: { bg: "transparent", empty: "#ebedf0", trail: "#57606a", text: "#24292f" },
  dark: { bg: "transparent", empty: "#161b22", trail: "#8b949e", text: "#c9d1d9" },
};

export const BIRD_SVG = `
<g id="bird">
  <path d="M -6 0 Q -2 -5 6 0 Q -2 5 -6 0 Z" fill="#ffb400" stroke="#c9820a" stroke-width="0.6"/>
  <path d="M -2 -1 Q -6 -7 -12 -3 Q -6 -2 -2 -1 Z" fill="#ff8c00">
    <animate attributeName="d"
      values="M -2 -1 Q -6 -7 -12 -3 Q -6 -2 -2 -1 Z;
              M -2 -1 Q -6 3 -12 1 Q -6 -1 -2 -1 Z;
              M -2 -1 Q -6 -7 -12 -3 Q -6 -2 -2 -1 Z"
      dur="0.35s" repeatCount="indefinite"/>
  </path>
  <circle cx="4.5" cy="-1" r="0.9" fill="#2b2b2b"/>
  <path d="M 6 0.5 L 9 0 L 6 -0.5 Z" fill="#e07b00"/>
</g>`.trim();

export function buildSvg(weeks, palette = "light") {
  const colors = PALETTES[palette] || PALETTES.light;
  const cell = 11;
  const gap = 3;
  const marginLeft = 20;
  const marginTop = 20;
  const width = marginLeft * 2 + weeks.length * (cell + gap);
  const height = marginTop * 2 + 7 * (cell + gap);

  const points = [];
  let totalContribs = 0;
  const rects = [];

  weeks.forEach((week, wi) => {
    const x = marginLeft + wi * (cell + gap);
    const days = week.contributionDays;
    const order = wi % 2 === 0 ? days.map((d, i) => i) : days.map((d, i) => i).reverse();
    order.forEach((di) => {
      const day = days[di];
      const y = marginTop + di * (cell + gap);
      const fill = day.contributionCount > 0 ? day.color : colors.empty;
      rects.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" ry="2" fill="${fill}"/>`);
      if (day.contributionCount > 0) {
        totalContribs += day.contributionCount;
        points.push({ x: x + cell / 2, y: y + cell / 2, count: day.contributionCount });
      }
    });
  });

  const pathD = points.length
    ? "M " + points.map((p) => `${p.x} ${p.y}`).join(" L ")
    : `M ${marginLeft} ${marginTop} L ${marginLeft} ${marginTop}`;

  const pathLen = points.reduce((acc, p, i) => {
    if (i === 0) return 0;
    const prev = points[i - 1];
    return acc + Math.hypot(p.x - prev.x, p.y - prev.y);
  }, 0);

  const totalDuration = Math.max(8, Math.min(40, points.length * 0.12));

  const topDays = [...points].sort((a, b) => b.count - a.count).slice(0, 6);
  const sparkles = topDays
    .map(
      (p, i) => `
    <g transform="translate(${p.x} ${p.y})" opacity="0">
      <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.5;1"
        dur="${totalDuration}s" begin="${(i / topDays.length) * totalDuration}s"
        repeatCount="indefinite"/>
      <path d="M0,-4 L1,-1 L4,0 L1,1 L0,4 L-1,1 L-4,0 L-1,-1 Z" fill="#ffd33d"/>
    </g>`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${colors.bg}"/>
  ${rects.join("\n  ")}
  <path d="${pathD}" fill="none" stroke="${colors.trail}" stroke-width="1"
    stroke-dasharray="${pathLen}" stroke-dashoffset="${pathLen}" stroke-linecap="round" opacity="0.55">
    <animate attributeName="stroke-dashoffset" from="${pathLen}" to="0"
      dur="${totalDuration}s" repeatCount="indefinite"/>
  </path>
  ${sparkles}
  ${BIRD_SVG}
  <text x="${marginLeft}" y="${height - 4}" font-family="monospace" font-size="9" fill="${colors.text}">
    ${totalContribs} contributions flown over
  </text>
  <use href="#bird">
    <animateMotion dur="${totalDuration}s" repeatCount="indefinite" rotate="auto" path="${pathD}"/>
  </use>
</svg>`;
}

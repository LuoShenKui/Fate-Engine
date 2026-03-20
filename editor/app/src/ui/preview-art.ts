type PreviewTone = {
  label: string;
  start: string;
  end: string;
  accent: string;
};

const resolveBrickTone = (category: string, id = ""): PreviewTone => {
  if (category === "ability" || id.includes("ability")) return { label: "ABILITY", start: "#70562a", end: "#2c2417", accent: "#f3b33e" };
  if (category === "enemy" || id.includes("guard")) return { label: "ENEMY", start: "#743d37", end: "#2f1f1d", accent: "#e18773" };
  if (category === "composite" || id.includes("house") || id.includes("warehouse")) return { label: "COMPOSITE", start: "#35516d", end: "#1d2a39", accent: "#8db6dd" };
  if (category === "scene-interaction" || id.includes("door") || id.includes("switch") || id.includes("trigger") || id.includes("ladder")) return { label: "INTERACT", start: "#46596d", end: "#212d38", accent: "#9ec3e9" };
  return { label: "BRICK", start: "#42515f", end: "#202a34", accent: "#c3d0df" };
};

const createPreviewUri = ({ title, subtitle, tone }: { title: string; subtitle: string; tone: PreviewTone }): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${tone.start}"/>
          <stop offset="100%" stop-color="${tone.end}"/>
        </linearGradient>
      </defs>
      <rect width="320" height="180" rx="18" fill="#161d26"/>
      <rect x="10" y="10" width="300" height="160" rx="14" fill="url(#bg)"/>
      <rect x="22" y="20" width="110" height="66" rx="12" fill="rgba(17,22,29,0.22)"/>
      <rect x="148" y="30" width="122" height="16" rx="8" fill="rgba(219,229,239,0.12)"/>
      <rect x="148" y="56" width="92" height="12" rx="6" fill="rgba(219,229,239,0.08)"/>
      <rect x="24" y="108" width="272" height="42" rx="14" fill="rgba(17,22,29,0.66)"/>
      <text x="28" y="42" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="${tone.accent}">${tone.label}</text>
      <text x="28" y="132" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#dbe5ef">${title.slice(0, 22)}</text>
      <text x="28" y="154" font-family="Arial, sans-serif" font-size="13" fill="#91a0b2">${subtitle.slice(0, 24)}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const getBrickPreviewUri = ({ id, name, category }: { id: string; name: string; category: string }): string =>
  createPreviewUri({
    title: name,
    subtitle: category,
    tone: resolveBrickTone(category, id),
  });

export const getScenePreviewUri = (name: string, kind: "template" | "preview"): string =>
  createPreviewUri({
    title: name,
    subtitle: kind === "template" ? "Forest Demo" : "Runtime Preview",
    tone: kind === "template" ? { label: "FOREST", start: "#4f5f76", end: "#25303e", accent: "#f7d895" } : { label: "PREVIEW", start: "#6f5731", end: "#302516", accent: "#f7d895" },
  });

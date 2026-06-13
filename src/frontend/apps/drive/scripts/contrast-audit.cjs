// Audit de contraste WCAG AA des tokens du DS (oklch → sRGB → ratio).
// AA : 4.5:1 texte normal, 3:1 texte large / éléments d'UI & graphiques.
// Lancer : node apps/drive/scripts/contrast-audit.cjs
//
// EXEMPTIONS ATTENDUES (les seuls FAIL restants sont volontaires) :
//  - border/background : bordures décoratives, jamais le SEUL indicateur d'un
//    contrôle (le focus passe par le ring `primary`, qui passe ≥3:1).
//  - syncing/encrypted icon sur fond clair : indicateurs de statut REDONDANTS,
//    doublés d'un texte `sr-only` → WCAG 1.4.11 satisfait par l'alternative.
//  - "ai-purple TEXT" en sombre : ai-purple est réservé aux remplissages et
//    accents graphiques (≥3:1), pas au texte courant (cf. ds.css).

// --- conversion oklch → sRGB linéaire → sRGB → luminance relative ----------
function oklchToLinearSrgb(L, C, H) {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
function relLuminance(L, C, H) {
  const [r, g, b] = oklchToLinearSrgb(L, C, H).map((v) => Math.max(0, Math.min(1, v)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(fg, bg) {
  const l1 = relLuminance(...fg);
  const l2 = relLuminance(...bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// --- tokens (depuis ds.css) -------------------------------------------------
const light = {
  background: [1, 0, 0],
  foreground: [0.21, 0.03, 271],
  card: [1, 0, 0],
  cardForeground: [0.21, 0.03, 271],
  primary: [0.52, 0.23, 277],
  primaryForeground: [0.98, 0.01, 277],
  secondary: [0.97, 0.01, 271],
  secondaryForeground: [0.3, 0.04, 271],
  muted: [0.97, 0.01, 271],
  mutedForeground: [0.518, 0.02, 271],
  accent: [0.962, 0.02, 277],
  accentForeground: [0.3, 0.06, 277],
  destructive: [0.565, 0.235, 27],
  destructiveForeground: [0.985, 0.01, 27],
  border: [0.92, 0.008, 271],
  syncing: [0.77, 0.16, 70],
  encrypted: [0.7, 0.15, 162],
  encryptedForeground: [0.26, 0.06, 162],
  aiPurple: [0.55, 0.24, 303],
  aiPurpleForeground: [0.985, 0.01, 303],
  sidebar: [0.985, 0.004, 271],
  sidebarForeground: [0.21, 0.03, 271],
};
const dark = {
  background: [0.205, 0.03, 271],
  foreground: [0.97, 0.01, 271],
  card: [0.24, 0.03, 271],
  cardForeground: [0.97, 0.01, 271],
  primary: [0.62, 0.2, 277],
  primaryForeground: [0.18, 0.04, 277],
  secondary: [0.28, 0.03, 271],
  secondaryForeground: [0.97, 0.01, 271],
  muted: [0.28, 0.03, 271],
  mutedForeground: [0.7, 0.02, 271],
  accent: [0.32, 0.05, 277],
  accentForeground: [0.97, 0.01, 277],
  destructive: [0.55, 0.21, 25],
  destructiveForeground: [0.985, 0.01, 25],
  border: [0.45, 0.02, 271], // approx de oklch(1 0 0 /10%) sur fond sombre
  syncing: [0.77, 0.16, 70],
  encrypted: [0.7, 0.15, 162],
  aiPurple: [0.55, 0.24, 303],
};

// paires [fg, bg, seuil, libellé]
function pairsFor(t, mode) {
  return [
    [t.foreground, t.background, 4.5, "foreground/background"],
    [t.cardForeground, t.card, 4.5, "card-foreground/card"],
    [t.mutedForeground, t.background, 4.5, "muted-foreground/background"],
    [t.mutedForeground, t.muted, 4.5, "muted-foreground/muted"],
    [t.primaryForeground, t.primary, 4.5, "primary-foreground/primary"],
    [t.secondaryForeground, t.secondary, 4.5, "secondary-foreground/secondary"],
    [t.accentForeground, t.accent, 4.5, "accent-foreground/accent"],
    [t.destructiveForeground, t.destructive, 4.5, "destructive-foreground/destructive"],
    [t.primary, t.background, 3, "primary/background (UI)"],
    [t.border, t.background, 3, "border/background (UI)"],
    [t.aiPurple, t.background, 4.5, "ai-purple TEXT/background"],
    [t.aiPurple, t.background, 3, "ai-purple icon/background (graphique)"],
    [t.syncing, t.background, 3, "syncing icon/background (graphique)"],
    [t.encrypted, t.background, 3, "encrypted icon/background (graphique)"],
    ...(mode === "light"
      ? [
          [t.primaryForeground, t.primary, 4.5, "ai-purple-fg/ai-purple"].map(
            () => null,
          ) && [t.aiPurpleForeground, t.aiPurple, 4.5, "ai-purple-foreground/ai-purple"],
          [t.encryptedForeground, t.encrypted, 4.5, "encrypted-foreground/encrypted"],
          [t.sidebarForeground, t.sidebar, 4.5, "sidebar-foreground/sidebar"],
        ]
      : []),
  ].filter(Boolean);
}

for (const [mode, t] of [["light", light], ["dark", dark]]) {
  console.log(`\n===== ${mode.toUpperCase()} =====`);
  for (const [fg, bg, th, label] of pairsFor(t, mode)) {
    const r = contrast(fg, bg);
    const ok = r >= th;
    console.log(`${ok ? "PASS" : "FAIL"}  ${r.toFixed(2)}:1  (≥${th})  ${label}`);
  }
}

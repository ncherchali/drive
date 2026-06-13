/**
 * Tailwind branché sur le design system Cunningham : les couleurs ne sont PAS
 * des valeurs en dur mais des références aux variables CSS générées par
 * `yarn build-theme` (tokens Sahla). Changer la marque = changer le token, pas
 * la config Tailwind. Source unique de vérité.
 *
 * `preflight` est désactivé : Tailwind n'apporte que des utilitaires, pas de
 * reset global, pour ne pas perturber les composants upstream (ui-kit/Cunningham).
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      // Chaque couleur pointe sur le token Cunningham (source de vérité) AVEC un
      // fallback hex : si la variable n'est pas résolue au point du DOM (les
      // tokens sont scopés à .cunningham-theme--*, pas à :root), la couleur de
      // marque s'affiche quand même. Quand la variable résout, elle suit le thème.
      colors: {
        primary: {
          DEFAULT: "var(--c--globals--colors--brand-650, #0E8C8C)",
          hover: "var(--c--globals--colors--brand-700, #0C7373)",
          soft: "var(--c--globals--colors--brand-050, #E7F4F4)",
          fg: "#ffffff",
        },
        surface: "var(--c--globals--colors--gray-000, #ffffff)",
        bg: "var(--c--globals--colors--gray-050, #f5f6f8)",
        border: "var(--c--globals--colors--gray-150, #d3d4e0)",
        ink: "var(--c--globals--colors--gray-900, #1b1b23)",
        muted: "var(--c--globals--colors--gray-600, #5d5d70)",
        success: "var(--c--globals--colors--success-600, #016d31)",
        warning: "var(--c--globals--colors--warning-600, #984800)",
        danger: "var(--c--globals--colors--error-600, #bd0f23)",
        seal: "var(--sahla-seal, #c2740e)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        arabic: ["Cairo", "sans-serif"],
      },
    },
  },
  plugins: [],
};

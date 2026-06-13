import { cunninghamConfig } from "@gouvfr-lasuite/ui-kit";
import deepMerge from "deepmerge";

const themesImages = {
  "anct-light": {
    favicon: "/assets/anct_favicon.png",
    logo: "/assets/anct_logo_beta.svg",
    "logo-icon": "/assets/anct_logo-icon.svg",
  },
  "dsfr-dark": {
    favicon: "/assets/favicon.png",
    logo: "/assets/logo_beta.svg",
    "logo-icon": "/assets/logo-icon_beta.svg",
  },
  "dsfr-light": {
    favicon: "/assets/favicon.png",
    logo: "/assets/logo_beta.svg",
    "logo-icon": "/assets/logo-icon_beta.svg",
  },
};

const themesGaufre = {
  "anct-light": {
    widgetPath: "https://static.suite.anct.gouv.fr/widgets/lagaufre.js",
    apiUrl:
      "https://operateurs.suite.anct.gouv.fr/api/v1.0/lagaufre/services/?operator=9f5624fc-ef99-4d10-ae3f-403a81eb16ef&siret=21870030000013",
  },
  "dsfr-dark": {
    widgetPath: "https://static.suite.anct.gouv.fr/widgets/lagaufre.js",
    apiUrl: "https://lasuite.numerique.gouv.fr/api/services",
  },
  "dsfr-light": {
    widgetPath: "https://static.suite.anct.gouv.fr/widgets/lagaufre.js",
    apiUrl: "https://lasuite.numerique.gouv.fr/api/services",
  },
};

const getComponents = (theme: keyof typeof themesImages) => {
  return {
    datagrid: {
      "body--background-color-hover":
        "ref(contextuals.background.semantic.contextual.primary)",
    },
    gaufre: {
      widgetPath: `'${themesGaufre[theme].widgetPath}'`,
      apiUrl: `'${themesGaufre[theme].apiUrl}'`,
    },
    favicon: {
      src: `'${themesImages[theme].favicon}'`,
    },
    logo: {
      src: `url('${themesImages[theme].logo}')`,
    },
    "logo-icon": {
      src: `url('${themesImages[theme]["logo-icon"]}')`,
    },
  };
};

// ---------------------------------------------------------------------------
// Identité Sahla — Étape 0.5, direction retenue : teal « clair & aéré »
// ---------------------------------------------------------------------------
// Rebranding par theming : on quitte l'identité de l'État français (thèmes
// dsfr-* / anct, logos DINUM, widget « la gaufre ») pour une marque souveraine
// de registre bancaire. Le teal #0E8C8C porte le primaire (palier brand-650,
// comme le faisait le bleu DSFR) ; l'or ambre #C2740E reste réservé aux moments
// « sceau » (coffre-fort, document certifié) via la variable CSS --sahla-seal.
// Une seule rampe sert les deux modes : le thème sombre référence des paliers
// plus clairs de cette même rampe (comme le fait DSFR).
const sahlaBrandRamp = {
  "brand-050": "#EEF7F7",
  "brand-100": "#DBEEEE",
  "brand-150": "#C9E5E5",
  "brand-200": "#B6DCDC",
  "brand-250": "#A3D3D3",
  "brand-300": "#91CACA",
  "brand-350": "#7EC1C1",
  "brand-400": "#6BB9B9",
  "brand-450": "#59B0B0",
  "brand-500": "#46A7A7",
  "brand-550": "#339E9E",
  "brand-600": "#219595",
  "brand-650": "#0E8C8C",
  "brand-700": "#0C7979",
  "brand-750": "#0A6666",
  "brand-800": "#085353",
  "brand-850": "#063F3F",
  "brand-900": "#042C2C",
  "brand-950": "#031919",
};

const sahlaImages = {
  "sahla-light": {
    favicon: "/assets/sahla_favicon.svg",
    logo: "/assets/sahla_logo.svg",
    "logo-icon": "/assets/sahla_logo-icon.svg",
    "logo-1": "#0E8C8C",
    "logo-2": "#C2740E",
  },
  "sahla-dark": {
    favicon: "/assets/sahla_favicon.svg",
    logo: "/assets/sahla_logo_dark.svg",
    "logo-icon": "/assets/sahla_logo-icon_dark.svg",
    "logo-1": "#3DB5B5",
    "logo-2": "#C2740E",
  },
};

const getSahlaTheme = (
  mode: keyof typeof sahlaImages,
  base: "dsfr-light" | "dsfr-dark",
) => {
  const img = sahlaImages[mode];
  return deepMerge((cunninghamConfig as any).themes[base], {
    globals: {
      colors: {
        ...sahlaBrandRamp,
        [`logo-1-${base === "dsfr-dark" ? "dark" : "light"}`]: img["logo-1"],
        [`logo-2-${base === "dsfr-dark" ? "dark" : "light"}`]: img["logo-2"],
      },
    },
    components: {
      datagrid: {
        "body--background-color-hover":
          "ref(contextuals.background.semantic.contextual.primary)",
      },
      // La gaufre (sélecteur d'applications de l'État) n'a pas de sens hors
      // écosystème La Suite : vidée ici et masquée dans <Gaufre />.
      gaufre: { widgetPath: "''", apiUrl: "''" },
      favicon: { src: `'${img.favicon}'` },
      logo: { src: `url('${img.logo}')` },
      "logo-icon": { src: `url('${img["logo-icon"]}')` },
    },
  });
};

const config = deepMerge(cunninghamConfig, {
  themes: {
    "anct-light": {
      components: getComponents("anct-light"),
    },
    "dsfr-light": {
      components: getComponents("dsfr-light"),
    },
    "dsfr-dark": {
      components: getComponents("dsfr-dark"),
    },
    "sahla-light": getSahlaTheme("sahla-light", "dsfr-light"),
    "sahla-dark": getSahlaTheme("sahla-dark", "dsfr-dark"),
  },
});

export default config;

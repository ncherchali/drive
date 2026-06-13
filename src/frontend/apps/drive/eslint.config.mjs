import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: [".next/**", "out/**", "node_modules/**", "public/**", "scripts/**"] },
  ...coreWebVitals,
  ...typescript,
  {
    // Limité aux sources React : les règles react-hooks/* ne sont chargées que
    // là (sinon ESLint plante sur un .cjs « plugin react-hooks introuvable »).
    files: ["**/*.{ts,tsx}"],
    rules: {
      "react-hooks/exhaustive-deps": "off",
      "@next/next/no-img-element": "off",
      // eslint-config-next 16 active les règles « React Compiler » de
      // eslint-plugin-react-hooks v6. Elles signalent du code préexistant ;
      // on les garde en avertissement (dette technique à traiter à part)
      // pour ne pas bloquer le lint sur la montée de version Next 16.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
    },
  },
];

export default eslintConfig;

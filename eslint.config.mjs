import next from "eslint-config-next";

/** Flat ESLint config (ESLint 9 / Next.js 16). */
const config = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**", "storage/**", "next-env.d.ts"],
  },
];

export default config;

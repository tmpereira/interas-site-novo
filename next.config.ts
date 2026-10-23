import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Site 100% estático: `next build` gera HTML/CSS/JS na pasta `out/`.
  output: "export",
  // Gera /equipe/index.html e links terminados em "/".
  trailingSlash: true,
  // Sem servidor não há otimização de imagens do Next.
  images: { unoptimized: true },
  sassOptions: {
    // O Bootstrap 5.3 ainda usa @import e funções antigas do Sass;
    // silencia os avisos de depreciação vindos de node_modules.
    quietDeps: true,
    silenceDeprecations: ["import", "global-builtin", "color-functions", "if-function"],
  },
};

export default nextConfig;

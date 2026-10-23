// Fontes do site (baixadas no build e servidas pelo próprio site, sem chamar o Google no navegador).
// Cada fonte vira uma variável CSS usada pelos tokens ($fonte-titulo, $fonte-base, $fonte-mono).
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

const titulo = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz"], variable: "--fonte-titulo", display: "swap" });
const texto = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--fonte-texto", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--fonte-mono", display: "swap" });

/** Classes que definem as variáveis das fontes; vão no <html>. */
export const classesFontes = [titulo.variable, texto.variable, mono.variable].join(" ");

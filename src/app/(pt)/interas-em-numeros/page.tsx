// Rota fina: a página fica em src/paginas/InterasEmNumeros.tsx, compartilhada pelos dois idiomas.
import InterasEmNumeros, { metadados } from "@/paginas/InterasEmNumeros";

export const generateMetadata = () => metadados("pt");

export default function Pagina() {
  return <InterasEmNumeros idioma="pt" />;
}

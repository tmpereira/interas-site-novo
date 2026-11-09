// Rota fina: a página fica em src/paginas/InterasEmNumeros.tsx, compartilhada pelos dois idiomas.
import InterasEmNumeros, { metadados } from "@/paginas/InterasEmNumeros";

export const generateMetadata = () => metadados("en");

export default function Pagina() {
  return <InterasEmNumeros idioma="en" />;
}

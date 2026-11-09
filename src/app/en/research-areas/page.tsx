// Rota fina: a página fica em src/paginas/AreasDePesquisa.tsx, compartilhada pelos dois idiomas.
import AreasDePesquisa, { metadados } from "@/paginas/AreasDePesquisa";

export const generateMetadata = () => metadados("en");

export default function Pagina() {
  return <AreasDePesquisa idioma="en" />;
}

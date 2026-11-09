// Rota fina: a página fica em src/paginas/AreasDePesquisa.tsx, compartilhada pelos dois idiomas.
import AreasDePesquisa, { metadados } from "@/paginas/AreasDePesquisa";

export const generateMetadata = () => metadados("pt");

export default function Pagina() {
  return <AreasDePesquisa idioma="pt" />;
}

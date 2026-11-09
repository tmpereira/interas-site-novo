// Rota fina: a página fica em src/paginas/Grupos.tsx, compartilhada pelos dois idiomas.
import Grupos, { metadados } from "@/paginas/Grupos";

export const generateMetadata = () => metadados("pt");

export default function Pagina() {
  return <Grupos idioma="pt" />;
}

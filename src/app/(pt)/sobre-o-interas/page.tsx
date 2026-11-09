// Rota fina: a página fica em src/paginas/Sobre.tsx, compartilhada pelos dois idiomas.
import Sobre, { metadados } from "@/paginas/Sobre";

export const generateMetadata = () => metadados("pt");

export default function Pagina() {
  return <Sobre idioma="pt" />;
}

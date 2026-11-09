// Rota fina: a página fica em src/paginas/Contato.tsx, compartilhada pelos dois idiomas.
import Contato, { metadados } from "@/paginas/Contato";

export const generateMetadata = () => metadados("pt");

export default function Pagina() {
  return <Contato idioma="pt" />;
}

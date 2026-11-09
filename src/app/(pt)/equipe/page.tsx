// Rota fina: a página fica em src/paginas/Equipe.tsx, compartilhada pelos dois idiomas.
import Equipe, { metadados } from "@/paginas/Equipe";

export const generateMetadata = () => metadados("pt");

export default function Pagina() {
  return <Equipe idioma="pt" />;
}

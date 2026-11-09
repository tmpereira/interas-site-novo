// Rota fina: a página fica em src/paginas/Inicio.tsx, compartilhada pelos dois idiomas.
import Inicio, { metadados } from "@/paginas/Inicio";

export const generateMetadata = () => metadados("pt");

export default function Pagina() {
  return <Inicio idioma="pt" />;
}

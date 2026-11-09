// Rota fina: a página fica em src/paginas/Noticias.tsx, compartilhada pelos dois idiomas.
import Noticias, { metadados } from "@/paginas/Noticias";

export const generateMetadata = () => metadados("pt");

export default function Pagina() {
  return <Noticias idioma="pt" />;
}

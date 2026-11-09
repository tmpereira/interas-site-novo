// Rota fina: a página fica em src/paginas/Publicacoes.tsx, compartilhada pelos dois idiomas.
import Publicacoes, { metadados } from "@/paginas/Publicacoes";

export const generateMetadata = () => metadados("en");

export default function Pagina() {
  return <Publicacoes idioma="en" />;
}

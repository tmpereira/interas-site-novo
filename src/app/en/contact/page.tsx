// Rota fina: a página fica em src/paginas/Contato.tsx, compartilhada pelos dois idiomas.
import Contato, { metadados } from "@/paginas/Contato";

export const generateMetadata = () => metadados("en");

export default function Pagina() {
  return <Contato idioma="en" />;
}

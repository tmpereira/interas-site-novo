// Rota fina: a página fica em src/paginas/Videos.tsx, compartilhada pelos dois idiomas.
import Videos, { metadados } from "@/paginas/Videos";

export const generateMetadata = () => metadados("en");

export default function Pagina() {
  return <Videos idioma="en" />;
}

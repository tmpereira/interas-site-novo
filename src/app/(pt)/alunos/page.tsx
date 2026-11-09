// Rota fina: a página fica em src/paginas/Alunos.tsx, compartilhada pelos dois idiomas.
import Alunos, { metadados } from "@/paginas/Alunos";

export const generateMetadata = () => metadados("pt");

export default function Pagina() {
  return <Alunos idioma="pt" />;
}

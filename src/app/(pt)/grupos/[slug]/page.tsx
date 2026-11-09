// Rota fina: a página fica em src/paginas/PaginaGrupo.tsx, compartilhada pelos dois idiomas.
import PaginaGrupo, { metadados, parametros } from "@/paginas/PaginaGrupo";

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = parametros;

export async function generateMetadata({ params }: Props) {
  return metadados("pt", (await params).slug);
}

export default async function Pagina({ params }: Props) {
  return <PaginaGrupo idioma="pt" slug={(await params).slug} />;
}

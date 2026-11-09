// Rota fina: a página fica em src/paginas/PaginaGrupo.tsx, compartilhada pelos dois idiomas.
import PaginaGrupo, { metadados, parametros } from "@/paginas/PaginaGrupo";

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = parametros;

export async function generateMetadata({ params }: Props) {
  return metadados("en", (await params).slug);
}

export default async function Pagina({ params }: Props) {
  return <PaginaGrupo idioma="en" slug={(await params).slug} />;
}

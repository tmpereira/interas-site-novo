// Rota fina: a página fica em src/paginas/PaginaPublicacao.tsx, compartilhada pelos dois idiomas.
import PaginaPublicacao, { metadados, parametros } from "@/paginas/PaginaPublicacao";

type Props = { params: Promise<{ id: string }> };

export const generateStaticParams = parametros;

export async function generateMetadata({ params }: Props) {
  return metadados("pt", (await params).id);
}

export default async function Pagina({ params }: Props) {
  return <PaginaPublicacao idioma="pt" id={(await params).id} />;
}

// Rota fina: a página fica em src/paginas/PerfilPessoa.tsx, compartilhada pelos dois idiomas.
import PerfilPessoa, { metadados, parametros } from "@/paginas/PerfilPessoa";

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = parametros;

export async function generateMetadata({ params }: Props) {
  return metadados("pt", (await params).slug);
}

export default async function Pagina({ params }: Props) {
  return <PerfilPessoa idioma="pt" slug={(await params).slug} />;
}

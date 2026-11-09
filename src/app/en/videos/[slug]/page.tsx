// Rota fina: a página fica em src/paginas/PaginaVideo.tsx, compartilhada pelos dois idiomas.
import PaginaVideo, { metadados, parametros } from "@/paginas/PaginaVideo";

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = parametros;

export async function generateMetadata({ params }: Props) {
  return metadados("en", (await params).slug);
}

export default async function Pagina({ params }: Props) {
  return <PaginaVideo idioma="en" slug={(await params).slug} />;
}

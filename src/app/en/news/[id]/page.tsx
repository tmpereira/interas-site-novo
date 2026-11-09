// Rota fina: a página fica em src/paginas/PaginaNoticia.tsx, compartilhada pelos dois idiomas.
import PaginaNoticia, { metadados, parametros } from "@/paginas/PaginaNoticia";

type Props = { params: Promise<{ id: string }> };

export const generateStaticParams = () => parametros("en");

export async function generateMetadata({ params }: Props) {
  return metadados("en", (await params).id);
}

export default async function Pagina({ params }: Props) {
  return <PaginaNoticia idioma="en" id={(await params).id} />;
}

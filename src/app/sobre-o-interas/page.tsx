import type { Metadata } from "next";
import PaginaTexto from "@/components/PaginaTexto";
import { paginaPorSlug } from "@/lib/consultas";
import { metadadosPagina } from "@/lib/metadados";

export function generateMetadata(): Metadata {
  const p = paginaPorSlug("sobre-o-interas");
  return metadadosPagina({ titulo: p.titulo, descricao: p.descricao, caminho: "/sobre-o-interas/" });
}

export default function Sobre() {
  return <PaginaTexto pagina={paginaPorSlug("sobre-o-interas")} rotuloTrilha="O INCT INTERAS" />;
}

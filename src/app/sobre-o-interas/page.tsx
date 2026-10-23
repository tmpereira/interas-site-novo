import type { Metadata } from "next";
import PaginaTexto from "@/components/PaginaTexto";
import { paginaPorSlug } from "@/lib/consultas";

export function generateMetadata(): Metadata {
  const p = paginaPorSlug("sobre-o-interas");
  return { title: p.titulo, description: p.descricao ?? undefined };
}

export default function Sobre() {
  return <PaginaTexto pagina={paginaPorSlug("sobre-o-interas")} rotuloTrilha="O INCT INTERAS" />;
}

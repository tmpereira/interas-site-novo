import type { Metadata } from "next";
import PaginaTexto from "@/components/PaginaTexto";
import { paginaPorSlug } from "@/lib/consultas";

export function generateMetadata(): Metadata {
  return { title: paginaPorSlug("areas-de-pesquisa").titulo };
}

export default function AreasDePesquisa() {
  return <PaginaTexto pagina={paginaPorSlug("areas-de-pesquisa")} rotuloTrilha="Áreas de Pesquisa" />;
}

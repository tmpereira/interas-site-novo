import type { Metadata } from "next";
import PaginaTexto from "@/components/PaginaTexto";
import { paginaPorSlug } from "@/lib/consultas";
import { metadadosPagina } from "@/lib/metadados";

export function generateMetadata(): Metadata {
  return metadadosPagina({ titulo: paginaPorSlug("areas-de-pesquisa").titulo, caminho: "/areas-de-pesquisa/" });
}

export default function AreasDePesquisa() {
  return <PaginaTexto pagina={paginaPorSlug("areas-de-pesquisa")} rotuloTrilha="Áreas de Pesquisa" />;
}

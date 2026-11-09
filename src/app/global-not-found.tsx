// Página 404 de todo o site (out/404.html). Com dois layouts raiz, (pt) e en, não há um layout
// único em que apoiar o not-found.tsx; por isso o 404 usa global-not-found (experimental.globalNotFound
// no next.config) e monta o documento inteiro. No export estático só existe um 404.html: fica em português.
import type { Metadata } from "next";
import { carregarConteudo } from "@/lib/conteudo";
import Documento, { metadadosRaiz } from "@/paginas/Documento";
import NaoEncontrada, { metadados } from "@/paginas/NaoEncontrada";

export function generateMetadata(): Metadata {
  const { site } = carregarConteudo();
  const meta = metadados("pt");
  return { ...metadadosRaiz("pt"), ...meta, title: `${String(meta.title)} | ${site.titulo}` };
}

export default function GlobalNotFound() {
  return (
    <Documento idioma="pt">
      <NaoEncontrada idioma="pt" />
    </Documento>
  );
}

// 404 dentro de /en/ (quando uma página em inglês chama notFound()). Endereços que não
// existem em lugar nenhum caem no 404 único do site (app/global-not-found.tsx, em português).
import NaoEncontrada, { metadados } from "@/paginas/NaoEncontrada";

export const metadata = metadados("en");

export default function NaoEncontradaEn() {
  return <NaoEncontrada idioma="en" />;
}

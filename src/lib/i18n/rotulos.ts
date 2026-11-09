/**
 * Rótulos de interface nos dois idiomas (CLAUDE.md, seção 13.4).
 * O português define as chaves; o tipo obriga o inglês a ter todas elas.
 * Etapa 1: só os textos do layout e do 404, com o inglês ainda em português.
 * A extração dos demais textos fixos dos componentes é a etapa 2.
 */
import type { Idioma } from "./rotas";

const pt = {
  pularParaConteudo: "Pular para o conteúdo",
  naoEncontrada: {
    tituloAba: "Página não encontrada",
    sobretitulo: "Erro 404",
    titulo: "Página não encontrada",
    texto: "O endereço que você acessou não existe ou foi movido.",
    voltar: "Voltar à página inicial",
  },
};

/** Mesma forma do português, com qualquer texto no lugar de cada valor. */
type Textos<T> = { [K in keyof T]: T[K] extends string ? string : Textos<T[K]> };
export type Rotulos = Textos<typeof pt>;

// TODO (etapa 2): traduzir.
const en: Rotulos = {
  pularParaConteudo: "Pular para o conteúdo",
  naoEncontrada: {
    tituloAba: "Página não encontrada",
    sobretitulo: "Erro 404",
    titulo: "Página não encontrada",
    texto: "O endereço que você acessou não existe ou foi movido.",
    voltar: "Voltar à página inicial",
  },
};

const ROTULOS: Record<Idioma, Rotulos> = { pt, en };

export const rotulos = (idioma: Idioma): Rotulos => ROTULOS[idioma];

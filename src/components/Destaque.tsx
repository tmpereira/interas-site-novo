import Link from "next/link";
import type { CSSProperties } from "react";
import type { Home } from "@/lib/esquemas";
import { markdownParaHtml } from "@/lib/markdown";

/** Bloco de destaque da home: imagem esmaecida de um lado, título, texto e botão do outro. */
export default function Destaque({ destaque }: { destaque: Home["destaques"][number] }) {
  const imagem = (
    <div className="destaque__imagem" style={{ "--imagem-fundo": `url("${destaque.imagem}")` } as CSSProperties} role="presentation" />
  );
  const texto = (
    <div className="destaque__texto">
      <h2 className="destaque__titulo">{destaque.titulo}</h2>
      <div className="destaque__corpo" dangerouslySetInnerHTML={{ __html: markdownParaHtml(destaque.texto) }} />
      {destaque.botao && (
        <Link href={destaque.botao.link} className="destaque__botao">
          {destaque.botao.rotulo}
        </Link>
      )}
    </div>
  );
  const esquerda = destaque.posicao_imagem === "esquerda";
  return (
    <section className={`destaque destaque--imagem-${destaque.posicao_imagem}`}>
      <div className="destaque__interno">
        <div className="destaque__grade">
          {esquerda ? imagem : texto}
          {esquerda ? texto : imagem}
        </div>
      </div>
    </section>
  );
}

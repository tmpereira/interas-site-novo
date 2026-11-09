"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Site } from "@/lib/esquemas";
import { IDIOMAS, type Idioma, LOCALE, NOME_IDIOMA, SIGLA_IDIOMA, caminhoEquivalente } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";
import { entradaDaPagina, estaEm, temItens } from "@/lib/menu";

type Props = {
  idioma: Idioma;
  logo: string;
  logoAlt: string;
  /** Menu já com os links no idioma da página. */
  menu: Site["menu"];
  /** Página inicial do idioma (link do logo). */
  inicio: string;
  /** Ids das notícias com versão em inglês: as outras levam à lista de notícias no seletor de idioma. */
  noticiasEn: string[];
};

/** Seta do botão de submenu (gira quando o submenu abre). */
function Seta() {
  return (
    <svg className="menu-principal__seta" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M2 3.5 5 6.5 8 3.5" />
    </svg>
  );
}

export default function Navbar({ idioma, logo, logoAlt, menu, inicio, noticiasEn }: Props) {
  const r = rotulos(idioma).layout;
  const [aberto, setAberto] = useState(false);
  const [submenuAberto, setSubmenuAberto] = useState<string | null>(null);
  const raiz = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const atual = entradaDaPagina(menu, pathname);

  // Fecha submenus ao clicar fora ou apertar Esc
  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setSubmenuAberto(null);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSubmenuAberto(null);
    };
    document.addEventListener("click", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("click", fora);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const aoNavegar = () => {
    setAberto(false);
    setSubmenuAberto(null);
    (document.activeElement as HTMLElement | null)?.blur();
  };

  return (
    <nav ref={raiz} className="menu-principal" aria-label={r.menuPrincipal}>
      <div className="menu-principal__container">
        <Link href={inicio} className="menu-principal__marca" onClick={aoNavegar}>
          <Image src={logo} alt={logoAlt} width={250} height={125} className="menu-principal__logo" priority />
        </Link>
        <button
          type="button"
          className="menu-principal__botao"
          aria-controls="menu-principal-lista"
          aria-expanded={aberto}
          onClick={() => setAberto(!aberto)}
        >
          {r.botaoMenu}
        </button>
        <div id="menu-principal-lista" className={`menu-principal__colapso${aberto ? " menu-principal__colapso--aberto" : ""}`}>
          <ul className="menu-principal__lista">
            {menu.map((entrada) => {
              const classeItem = `menu-principal__item${entrada === atual ? " menu-principal__item--atual" : ""}`;
              if (!temItens(entrada)) {
                const ativo = estaEm(pathname, entrada.link);
                return (
                  <li key={entrada.rotulo} className={classeItem}>
                    <Link href={entrada.link} className="menu-principal__link" aria-current={ativo ? "page" : undefined} onClick={aoNavegar}>
                      {entrada.rotulo}
                    </Link>
                  </li>
                );
              }
              const subAberto = submenuAberto === entrada.rotulo;
              return (
                <li key={entrada.rotulo} className={`${classeItem}${subAberto ? " menu-principal__item--aberto" : ""}`}>
                  <button
                    type="button"
                    className="menu-principal__link menu-principal__link--submenu"
                    aria-expanded={subAberto}
                    onClick={() => setSubmenuAberto(subAberto ? null : entrada.rotulo)}
                  >
                    {entrada.rotulo}
                    <Seta />
                  </button>
                  <div className="menu-principal__painel">
                    <ul className="menu-principal__submenu">
                      {entrada.itens.map((item) => (
                        <li key={item.link}>
                          <Link href={item.link} className="menu-principal__subitem" onClick={aoNavegar}>
                            {item.rotulo}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
            <li className="menu-principal__item menu-principal__item--idiomas">
              <SeletorIdioma idioma={idioma} caminho={pathname} rotulo={r.idioma} noticiasEn={noticiasEn} />
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

/**
 * Seletor PT | EN: o idioma atual marcado e o outro com link para a página equivalente
 * (`caminhoEquivalente`). Trocar de idioma recarrega a página (cada idioma tem o seu layout
 * raiz), por isso é um <a> comum; o clique mantém os filtros e a âncora do endereço.
 */
function SeletorIdioma({ idioma, caminho, rotulo, noticiasEn }: { idioma: Idioma; caminho: string; rotulo: string; noticiasEn: string[] }) {
  const traduzidas = new Set(noticiasEn);
  const existe = (destino: Idioma) => (chave: string, slug: string) => destino === "pt" || chave !== "noticias" || traduzidas.has(slug);
  return (
    <div className="seletor-idioma" role="group" aria-label={rotulo}>
      {IDIOMAS.map((i) =>
        i === idioma ? (
          <span key={i} className="seletor-idioma__opcao seletor-idioma__opcao--atual" lang={LOCALE[i]} aria-current="true" title={NOME_IDIOMA[i]}>
            {SIGLA_IDIOMA[i]}
          </span>
        ) : (
          <a
            key={i}
            href={caminhoEquivalente(caminho, i, existe(i))}
            className="seletor-idioma__opcao"
            lang={LOCALE[i]}
            hrefLang={LOCALE[i]}
            title={NOME_IDIOMA[i]}
            aria-label={NOME_IDIOMA[i]}
            onClick={(e) => {
              const { search, hash } = window.location;
              if (!search && !hash) return;
              e.preventDefault();
              window.location.assign(e.currentTarget.getAttribute("href") + search + hash);
            }}
          >
            {SIGLA_IDIOMA[i]}
          </a>
        ),
      )}
    </div>
  );
}

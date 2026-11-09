"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Site } from "@/lib/esquemas";
import { entradaDaPagina, estaEm, temItens } from "@/lib/menu";

type Props = {
  logo: string;
  logoAlt: string;
  /** Menu já com os links no idioma da página. */
  menu: Site["menu"];
  /** Página inicial do idioma (link do logo). */
  inicio: string;
};

/** Seta do botão de submenu (gira quando o submenu abre). */
function Seta() {
  return (
    <svg className="menu-principal__seta" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M2 3.5 5 6.5 8 3.5" />
    </svg>
  );
}

export default function Navbar({ logo, logoAlt, menu, inicio }: Props) {
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
    <nav ref={raiz} className="menu-principal" aria-label="Principal">
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
          Menu
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
          </ul>
        </div>
      </div>
    </nav>
  );
}

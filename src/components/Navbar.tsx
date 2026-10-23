"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Site } from "@/lib/esquemas";

type Props = {
  titulo: string;
  logo: string;
  logoAlt: string;
  menu: Site["menu"];
};

type Item = { rotulo: string; link: string };
type Submenu = { rotulo: string; itens: Item[] };

const temItens = (entrada: Site["menu"][number]): entrada is Submenu => "itens" in entrada;

/** Caminho de um link sem âncora nem parâmetros, para comparar com a página atual. */
const caminho = (link: string) => link.split(/[?#]/)[0];

export default function Navbar({ titulo, logo, logoAlt, menu }: Props) {
  const [aberto, setAberto] = useState(false);
  const [submenuAberto, setSubmenuAberto] = useState<string | null>(null);
  const raiz = useRef<HTMLElement>(null);
  const pathname = usePathname();

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
  };
  const ativo = (link: string) => caminho(link) === pathname;

  return (
    <nav ref={raiz} className="menu-principal" data-bs-theme="dark" aria-label="Principal">
      <div className="menu-principal__container">
        <Link href="/" className="menu-principal__marca" onClick={aoNavegar}>
          <Image src={logo} alt={logoAlt} width={48} height={24} className="menu-principal__logo" />
          <span>{titulo}</span>
        </Link>
        <button
          type="button"
          className="menu-principal__botao"
          aria-controls="menu-principal-lista"
          aria-expanded={aberto}
          aria-label="Alternar navegação"
          onClick={() => setAberto(!aberto)}
        >
          <span className="menu-principal__icone-botao" />
        </button>
        <div id="menu-principal-lista" className={`menu-principal__colapso${aberto ? " show" : ""}`}>
          <ul className="menu-principal__lista">
            {menu.map((entrada) =>
              temItens(entrada) ? (
                <li key={entrada.rotulo} className="menu-principal__item">
                  <button
                    type="button"
                    className="menu-principal__link menu-principal__link--submenu"
                    aria-expanded={submenuAberto === entrada.rotulo}
                    onClick={() => setSubmenuAberto(submenuAberto === entrada.rotulo ? null : entrada.rotulo)}
                  >
                    {entrada.rotulo}
                  </button>
                  <ul className={`menu-principal__submenu${submenuAberto === entrada.rotulo ? " show" : ""}`}>
                    {entrada.itens.map((item) => (
                      <li key={item.link}>
                        <Link href={item.link} className="menu-principal__subitem" onClick={aoNavegar}>
                          {item.rotulo}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={entrada.rotulo} className="menu-principal__item">
                  <Link
                    href={(entrada as Item).link}
                    className={`menu-principal__link${ativo((entrada as Item).link) ? " active" : ""}`}
                    aria-current={ativo((entrada as Item).link) ? "page" : undefined}
                    onClick={aoNavegar}
                  >
                    {entrada.rotulo}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

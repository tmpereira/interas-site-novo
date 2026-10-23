import Image from "next/image";
import type { Site } from "@/lib/esquemas";

export default function Rodape({ rodape }: { rodape: Site["rodape"] }) {
  return (
    <footer className="rodape">
      <div className="rodape__conteudo">
        {rodape.logo ? (
          <Image src={rodape.logo} alt="INTERAS" width={94} height={40} className="rodape__logo" />
        ) : (
          <span />
        )}
        <p className="mb-0">{rodape.texto}</p>
        <ul className="rodape__redes">
          {rodape.redes.map((rede) => (
            <li key={rede.url}>
              <a href={rede.url} target="_blank" rel="noopener noreferrer" aria-label={rede.rotulo}>
                <i className={`bi bi-${rede.icone}`} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

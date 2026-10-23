import Image from "next/image";
import type { Site } from "@/lib/esquemas";

export default function Rodape({ rodape, descricao }: { rodape: Site["rodape"]; descricao: string | null }) {
  return (
    <footer className="rodape">
      <div className="rodape__conteudo">
        <div className="rodape__marca">
          {rodape.logo && <Image src={rodape.logo} alt="INTERAS" width={94} height={40} className="rodape__logo" />}
          {descricao && <p className="rodape__descricao">{descricao}</p>}
        </div>
        <p className="rodape__texto">{rodape.texto}</p>
        {rodape.redes.length > 0 && (
          <ul className="rodape__redes">
            {rodape.redes.map((rede) => (
              <li key={rede.url}>
                <a href={rede.url} target="_blank" rel="noopener noreferrer" aria-label={rede.rotulo}>
                  <i className={`bi bi-${rede.icone}`} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </footer>
  );
}

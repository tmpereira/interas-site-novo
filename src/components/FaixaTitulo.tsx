/** Faixa de título de largura total das páginas de listagem (o <h1> da página). */
export default function FaixaTitulo({ titulo, etiquetas }: { titulo: string; etiquetas?: string[] }) {
  return (
    <header className="faixa-titulo">
      <div className="pagina">
        <h1 className="faixa-titulo__titulo">{titulo}</h1>
        {etiquetas && etiquetas.length > 0 && (
          <p className="faixa-titulo__etiquetas">
            {etiquetas.map((e) => (
              <span key={e} className="etiqueta">
                {e}
              </span>
            ))}
          </p>
        )}
      </div>
    </header>
  );
}

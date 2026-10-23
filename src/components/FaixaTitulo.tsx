/** Faixa de título de largura total das páginas de listagem (o <h1> da página). */
export default function FaixaTitulo({ titulo }: { titulo: string }) {
  return (
    <header className="faixa-titulo">
      <div className="pagina">
        <h1 className="faixa-titulo__titulo">{titulo}</h1>
      </div>
    </header>
  );
}

import Link from "next/link";

export type ItemTrilha = { rotulo: string; href?: string };

/** Trilha de navegação: "Home" é sempre o primeiro item; o último é a página atual. */
export default function Breadcrumb({ itens }: { itens: ItemTrilha[] }) {
  const todos: ItemTrilha[] = [{ rotulo: "Home", href: "/" }, ...itens];
  return (
    <nav aria-label="Trilha de navegação">
      <ol className="trilha">
        {todos.map((item, i) => {
          const ultimo = i === todos.length - 1;
          return (
            <li key={`${item.rotulo}-${i}`} className={`trilha__item${ultimo ? " active" : ""}`} aria-current={ultimo ? "page" : undefined}>
              {item.href && !ultimo ? <Link href={item.href}>{item.rotulo}</Link> : <span className="trilha__texto" title={item.rotulo}>{item.rotulo}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

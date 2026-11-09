// Layout raiz do site em português (URLs sem prefixo, <html lang="pt-BR">). O HTML comum fica em src/paginas/Documento.tsx.
import Documento, { metadadosRaiz } from "@/paginas/Documento";

export const generateMetadata = metadadosRaiz;

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Documento idioma="pt">{children}</Documento>;
}

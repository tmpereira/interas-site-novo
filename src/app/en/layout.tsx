// Layout raiz do site em inglês (URLs sob /en/, <html lang="en">). O HTML comum fica em src/paginas/Documento.tsx.
import Documento, { metadadosRaiz } from "@/paginas/Documento";

export const generateMetadata = metadadosRaiz;

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Documento idioma="en">{children}</Documento>;
}

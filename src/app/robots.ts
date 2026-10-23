import type { MetadataRoute } from "next";
import { carregarConteudo } from "@/lib/conteudo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const { site } = carregarConteudo();
  return { rules: { userAgent: "*", allow: "/" }, sitemap: new URL("/sitemap.xml", site.url_base).toString() };
}

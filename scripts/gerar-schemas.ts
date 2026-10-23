// `npm run schemas`: gera content/schemas/*.schema.json a partir de src/lib/esquemas.ts.
// Esses arquivos dão autocompletar e erros no VS Code; não edite à mão.

import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ARQUIVOS_JSON } from "../src/lib/esquemas.ts";

const pasta = path.join(process.cwd(), "content", "schemas");
fs.mkdirSync(pasta, { recursive: true });

for (const [nome, esquema] of Object.entries(ARQUIVOS_JSON)) {
  const destino = nome.replace(/\.json$/, ".schema.json");
  // io: "input" descreve o JSON como é escrito no arquivo.
  const schema = z.toJSONSchema(esquema, { target: "draft-7", io: "input", unrepresentable: "any" });
  const comTitulo = {
    $comment: "Gerado por `npm run schemas` a partir de src/lib/esquemas.ts. Não edite à mão.",
    title: `content/${nome}`,
    ...schema,
  };
  fs.writeFileSync(path.join(pasta, destino), JSON.stringify(comTitulo, null, 2) + "\n");
  console.log(`✓ content/schemas/${destino}`);
}

import { revalidatePath, revalidateTag } from "next/cache";
import { ETIQUETAS } from "./dados";

/* o site lê em cache (lib/dados.ts, 09/10/2026, do molde): quem grava
   apaga as etiquetas e refaz as páginas, e o site mostra na hora */
export function atualizarVitrine() {
  for (const etiqueta of ETIQUETAS) revalidateTag(etiqueta);
  revalidatePath("/", "layout");
}

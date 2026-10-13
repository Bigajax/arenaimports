import Image from "next/image";
import { redirect } from "next/navigation";
import { FormularioLogin } from "@vitrine/plataforma/painel/FormularioLogin";
import { sessao } from "@vitrine/plataforma/lib/auth";
import { MODO } from "@vitrine/plataforma/lib/dados";
import { site } from "@/data/site.config";
import "./entrada.css";

export const dynamic = "force-dynamic";

/**
 * A ENTRADA DO PAINEL COM A CARA DA ARENA (13/10/2026, a loja entra no
 * pacote). O painel vem do @vitrine/plataforma, e a entrada continua dela.
 * A CAPA É A LOGO DA LOJA, a inteira com o Floripa, grande, no preto da
 * marca (regra do Rafael para toda loja, nascida na Japa), e o verde-raio
 * (#cef745) no botão e no fio. No computador, a logo à esquerda e o
 * formulário à direita; no celular, a logo numa faixa em cima e o formulário
 * logo abaixo, à mão.
 */
export default async function PaginaLogin() {
  const { autenticado } = await sessao();
  if (autenticado) redirect("/painel");

  return (
    <div className="ar-entrada">
      <div className="ar-entrada__capa">
        <Image src="/marca/logo.png" alt={site.nome} width={621} height={417} priority className="ar-entrada__logo" />
        <p className="ar-entrada__frase">Importados premium direto da fonte, de Florianópolis para todo o Brasil.</p>
      </div>

      <div className="ar-entrada__lado">
        <div className="ar-entrada__caixa">
          <p className="ar-entrada__rotulo">Painel da loja</p>
          <h1 className="ar-entrada__titulo">Entrar</h1>

          <FormularioLogin pedeEmail={MODO === "supabase"} />

          <p className="ar-entrada__ajuda">
            Esqueceu a senha?{" "}
            <a href="https://wa.me/5544991246187?text=Oi%20Rafael%2C%20esqueci%20a%20senha%20do%20painel%20da%20Arena." target="_blank" rel="noreferrer">
              Chame o Rafael no WhatsApp
            </a>
          </p>
        </div>
        <p className="ar-entrada__assina">Painel feito por Rafael Razeira Estúdio</p>
      </div>
    </div>
  );
}

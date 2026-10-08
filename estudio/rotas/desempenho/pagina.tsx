import { redirect } from "next/navigation";
import { PainelDesempenho } from "@/estudio/componentes/desempenho/PainelDesempenho";
import { ContagemPerformance } from "@/estudio/componentes/desempenho/ContagemPerformance";
import { sessao } from "@/lib/auth";
import { carregarCatalogo } from "@/lib/dados";
import {
  RELATORIO_BASE,
  TEM_PERFORMANCE,
  lerPainel,
  listarLinks,
  listarRelatorios,
} from "@/estudio/lib/performance";
import {
  evolucao,
  frasePecas,
  melhorDia,
  montarDados,
  diaLocal,
  dadosDeExemplo,
  proximaDataComercial,
  urlDoPost,
} from "@/estudio/lib/desempenho";
import { notasDeAtencao } from "@/estudio/lib/atencao";
import { linkUpgrade } from "@/estudio/lib/oferta-performance";
import "@/estudio/rotas/desempenho/desempenho.css";



/**
 * A ABA DESEMPENHO (02/10/2026 na Japa, no molde em 06/10). Os números
 * vêm do central do estúdio (lib/performance.ts), e a TRAVA mora lá: o
 * bloco `acesso` diz o que está liberado, e travada a função nem manda os
 * blocos pagos (só as duas contagens de `atencao`). Aqui se monta o que a
 * página mostra, inclusive as frases que interpretam os números e as
 * notas de atenção, que são regras puras (lib/atencao.ts) rodando no
 * servidor. O componente só desenha.
 */
export default async function PaginaDesempenho({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const { autenticado } = await sessao();
  if (!autenticado) redirect("/painel/login");

  if (!TEM_PERFORMANCE) {
    return (
      <div className="pn-miolo">
        <h1 className="pn-titulo">Desempenho</h1>
        <p className="vis-intro">
          A contagem de visitas ainda não está ligada nesta loja. Quando ligar,
          os números aparecem aqui.
        </p>
      </div>
    );
  }

  const sp = await searchParams;
  const pedido = [7, 30, 90].includes(Number(sp.dias)) ? Number(sp.dias) : 30;

  const [soma, links, { produtos }, relatorios] = await Promise.all([
    lerPainel(pedido),
    listarLinks(),
    carregarCatalogo(),
    listarRelatorios(),
  ]);

  if (!soma) {
    return (
      <div className="pn-miolo">
        <h1 className="pn-titulo">Desempenho</h1>
        <p className="vis-intro">
          Não deu para carregar os números agora. Recarregue a página em
          instantes.
        </p>
      </div>
    );
  }

  /* travada, o central já cortou o período em 30: o seletor acompanha */
  const periodo = soma.periodo || pedido;
  const { dados, numerosPecas } = montarDados(soma, produtos, links, periodo);
  /* os posts no gráfico (07/10): o dia em que cada link nasceu, no fuso da loja */
  const marcos = links
    .filter((l) => l.criado_em)
    .map((l) => ({ d: diaLocal(new Date(l.criado_em as string)), nome: l.nome }));
  const { acesso } = soma;
  /* a página de pagar do estúdio (07/10); sem o id da loja (central antigo), nula */
  const assinar = acesso.loja ? `${RELATORIO_BASE}/assinar/${acesso.loja}` : null;
  const travados = !acesso.liberado;

  /* as contagens que vêm mesmo travada seguem para o esqueleto do estoque */
  dados.atencaoFechada = soma.atencao ?? null;

  /* travada, a parte paga aparece desfocada com dados de EXEMPLO (07/10): o
     central não manda buscas, números, posts, horários nem a comparação, e
     a tela precisa mostrar a forma do que o plano entrega. Só os blocos
     pagos vêm do exemplo; os números e as listas grátis seguem reais, e as
     notas de atenção são calculadas antes, com os dados reais. */
  const exemplo = travados ? dadosDeExemplo() : null;
  const dadosTela = exemplo
    ? {
        ...dados,
        buscas: exemplo.buscas,
        esgotados: exemplo.esgotados,
        numeros: exemplo.numeros,
        links: exemplo.links,
        grade: exemplo.grade,
        volta: exemplo.volta,
      }
    : dados;
  /* sem ninguém no período (07/10: "quando não tem dados não aparece os
     gráficos, tinha que aparecer"): a parte grátis mostra a forma dela com
     o mesmo exemplo, apagada e marcada "Exemplo", até a primeira visita */
  const exemploVazio = dados.total.pessoas ? null : (exemplo ?? dadosDeExemplo());
  const numerosPecasTela = exemplo ? exemplo.numeros.map((n) => n.peca) : numerosPecas;

  return (
    <div className="pn-miolo vis-pagina">
      {/* liberado por tempo: o aviso abre uma vez, em modal, e some depois de fechado */}
      {/* a contagem, a renovação e a reativação (07/10): substitui o modal
          "liberado até", que mandava falar com o estúdio */}
      <ContagemPerformance liberadoAte={acesso.liberado_ate} paraSempre={acesso.para_sempre} renovaSozinho={Boolean(acesso.renova_sozinho)} assinar={assinar} />
      <PainelDesempenho
        dados={dadosTela}
        periodo={periodo}
        links={links.map((l) => ({
          id: l.id,
          nome: l.nome,
          url: urlDoPost(l.slug),
        }))}
        numerosPecas={numerosPecasTela}
        marcos={marcos}
        proximaData={proximaDataComercial(new Date())}
        mesAtual={new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "America/Sao_Paulo" }).format(new Date())}
        travados={travados}
        exemplo={exemploVazio}
        assinar={assinar}
        relatorio={
          relatorios[0]
            ? {
                mes: relatorios[0].mes,
                url: `${RELATORIO_BASE}/relatorio/${relatorios[0].token}`,
              }
            : null
        }
        atencao={notasDeAtencao(dados, soma.atencao ?? null, travados, {
          upgrade: acesso.upgrade ?? null,
          pecasAtivas: produtos.filter((p) => p.ativo).length,
          link: (degrau) => (acesso.loja ? linkUpgrade(RELATORIO_BASE, acesso.loja, degrau) : null),
        })}
        frases={{
          melhorDia: melhorDia(dados.dias),
          pecas: frasePecas(dados.pecas),
          evolucao: exemplo
            ? evolucao(exemplo.total, exemplo.antes, exemplo.volta)
            : evolucao(dados.total, dados.antes, dados.volta),
        }}
      />
    </div>
  );
}

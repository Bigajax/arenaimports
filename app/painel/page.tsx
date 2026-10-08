import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { IconePainel, MANUAL, type NomeIconePainel } from "@/components/painel/Navegacao";
import { HojeNaLoja, HojeOsso } from "@/estudio/componentes/HojeNaLoja";
import { ProximoPasso } from "@/estudio/componentes/ProximoPasso";
/* o modal de pagar (PagarAqui) mora no CSS da Desempenho */
import "@/estudio/rotas/desempenho/desempenho.css";
import { sessao } from "@/lib/auth";
import { carregarCatalogo } from "@/lib/dados";

export const dynamic = "force-dynamic";

/**
 * O INÍCIO DO PAINEL DA ARENA (08/10/2026, o Início do molde). Abre no que
 * o Luiz veio fazer, escrito como ele pensaria ("chegou o par"), e embaixo
 * o estado da loja. Sem banners nem textos: o site da Arena não lê os dois
 * do painel. A antiga primeira tela (a lista de peças) mora em Peças.
 */
const TAREFAS: { href: string; icone: NomeIconePainel; nome: string; como: string }[] = [
  {
    href: "/painel/pecas?nova=1",
    icone: "mais",
    nome: "Cadastrar peça nova",
    como: "Foto, nome e preço, ou o link do álbum do Yupoo. Nasce como encomenda.",
  },
  {
    href: "/painel/pecas",
    icone: "preco",
    nome: "Chegou o par, mudou o preço",
    como: "Ligue Em mãos quando chegar; desligue No site quando acabar. Nada se perde.",
  },
  {
    href: "/painel/desempenho",
    icone: "grafico",
    nome: "Ver quem entrou e quem chamou",
    como: "Quantas pessoas visitaram, que peças olharam e quantas chamaram no WhatsApp.",
  },
  {
    href: "/painel/config",
    icone: "loja",
    nome: "Mudar o WhatsApp ou a frase do topo",
    como: "O número que recebe os pedidos, o Instagram e as frases da loja.",
  },
];

export default async function PaginaInicio() {
  const { autenticado } = await sessao();
  if (!autenticado) redirect("/painel/login");

  const { produtos } = await carregarCatalogo();
  const noSite = produtos.filter((p) => p.ativo);
  const emMaos = noSite.filter((p) => p.pronta_entrega);
  const semPreco = noSite.filter((p) => p.preco === null && p.preco_promocional === null);
  const fora = produtos.length - noSite.length;

  const hora = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date())) % 24;
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="pn-miolo">
      <p className="pn-oi">{saudacao}, Luiz.</p>
      <h1 className="pn-titulo mt-1">O que vai fazer hoje?</h1>

      {/* os números de hoje chegam em streaming: a página não espera o central */}
      <Suspense fallback={<HojeOsso />}>
        <HojeNaLoja />
      </Suspense>

      <nav aria-label="Tarefas" className="pn-tarefas">
        {TAREFAS.map((t) => (
          <Link key={t.href} href={t.href} className="pn-tarefa">
            <span className="pn-tarefa__sol">
              <IconePainel nome={t.icone} />
            </span>
            <span>
              <span className="pn-tarefa__nome block">{t.nome}</span>
              <span className="pn-tarefa__como block">{t.como}</span>
            </span>
            <IconePainel nome="seta" className="pn-tarefa__seta" />
          </Link>
        ))}
      </nav>

      <p className="pn-manual-nota">
        Primeira vez aqui?{" "}
        <a href={MANUAL} target="_blank" rel="noreferrer">
          Leia o guia da loja
        </a>
        : cinco minutos, e o resto fica fácil.
      </p>

      {/* a escada da vitrine: o próximo passo, com o pagamento ali mesmo */}
      <Suspense fallback={null}>
        <ProximoPasso />
      </Suspense>

      <section className="pn-resumo" aria-labelledby="titulo-resumo">
        <h2 id="titulo-resumo">Como está a loja agora</h2>
        <ul>
          <li>
            <b>{noSite.length}</b>
            <span>{noSite.length === 1 ? "peça aparece" : "peças aparecem"} no site.</span>
          </li>
          <li>
            <b>{emMaos.length}</b>
            <span>
              {emMaos.length === 1 ? "está em mãos" : "estão em mãos"}, na Pronta entrega; o resto é sob encomenda.{" "}
              <Link href="/painel/pecas">Marcar o que chegou</Link>
            </span>
          </li>
          {semPreco.length ? (
            <li>
              <b>{semPreco.length}</b>
              <span>
                {semPreco.length === 1 ? "peça está" : "peças estão"} sem preço, e no site aparecem sem valor. Com o preço à vista, o cliente decide sem precisar perguntar.{" "}
                <Link href="/painel/pecas?filtro=sem-preco">Pôr os preços</Link>
              </span>
            </li>
          ) : null}
          {fora ? (
            <li>
              <b>{fora}</b>
              <span>{fora === 1 ? "peça está guardada" : "peças estão guardadas"}, fora do site. Religue quando voltar.</span>
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

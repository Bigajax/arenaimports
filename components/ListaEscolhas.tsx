"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coracao, useEscolhas } from "./Escolhas";
import { CardProduto } from "./CardProduto";
import type { Produto as ProdutoArena } from "@/lib/tipos";
import { disponibilidade, subtotal } from "@vitrine/plataforma/lib/escolhas";
import { medir } from "@vitrine/plataforma/estudio/lib/medir";
import { linkWhatsApp } from "@vitrine/plataforma/lib/whatsapp";
import { precoBRL } from "@vitrine/plataforma/lib/formato";
import { medirInteresse } from "@vitrine/plataforma/estudio/lib/interesse-cliente";
import type { Produto } from "@vitrine/plataforma/lib/tipos";
import { site } from "@/data/site.config";
import { comReferencia } from "./referenciaWhatsApp";

export function ListaEscolhas({ tipo, whatsapp = "", compacta = false, continuar }: { tipo: "favoritos" | "sacola"; whatsapp?: string; compacta?: boolean; continuar?: () => void }) {
  const { dados, pronto, produtos, limpar, alterar, removerFavorito, habilitados } = useEscolhas();
  const origem = usePathname() || "/sacola";
  const [tentativa, setTentativa] = useState(0);
  const [catalogo, setCatalogo] = useState(produtos);
  const [erros, setErros] = useState<Record<string,string>>({});
  const [estado, setEstado] = useState<"inicial" | "atualizando" | "pronto" | "erro">("inicial");
  const [copiado, setCopiado] = useState(false);
  const contou = useRef(false);
  const [enviando, setEnviando] = useState(false);
  const [avisoEnvio, setAvisoEnvio] = useState("");
  const [destinoPronto, setDestinoPronto] = useState("");
  const chave = JSON.stringify(dados.sacola);
  const atual = useRef(chave); atual.current = chave;
  useEffect(() => {
    if (!pronto || tipo !== "sacola" || !dados.sacola.length) return;
    if (!contou.current) { contou.current = true; medirInteresse({ acao:"sacola_aberta", origem: compacta ? origem : "/sacola" }); }
    const abort = new AbortController();
    setEstado("atualizando"); setDestinoPronto(""); setAvisoEnvio("");
    fetch("/api/escolhas", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ itens:dados.sacola.map(r => ({id:r.id,tamanho:r.tamanho,cor:r.cor,quantidade:r.quantidade})) }), signal:abort.signal, cache:"no-store" }).then(async r => {
      if (!r.ok) throw new Error("revisao"); const resposta = await r.json();
      setCatalogo(resposta.produtos); setErros(resposta.erros); setEstado("pronto");
    }).catch(() => { if (!abort.signal.aborted) setEstado("erro"); });
    return () => abort.abort();
  }, [pronto, tipo, chave, tentativa, compacta, origem]);
  const lista = tipo === "favoritos" ? dados.favoritos : dados.sacola;
  const linhas = dados.sacola.map(r => ({ linha:r, produto:catalogo.find(p => p.id === r.id), quantidade:r.quantidade }));
  const total = subtotal(linhas);
  const bloqueado = estado !== "pronto" || linhas.some(({linha:r,produto:p}) => disponibilidade(p,r) || erros[JSON.stringify([r.id,r.tamanho,r.cor])]);
  const montarResumo = (linhas: {linha: (typeof dados.sacola)[number]; produto?: Produto; quantidade:number}[], total:number|null) => ["Olá! Tenho interesse nestas peças:", ...linhas.map(({linha:r,produto:p},i) => `${i+1}. ${p?.nome ?? "Peça indisponível"}\nTamanho: ${r.tamanho || "a confirmar"}${r.cor ? ` · Cor: ${r.cor}` : ""} · Quantidade: ${r.quantidade}\n${p && precoBRL(p.preco_promocional ?? p.preco) ? `Valor anunciado por unidade: ${precoBRL(p.preco_promocional ?? p.preco)}\n` : "Valor a confirmar\n"}${site.url}/produto/${p?.slug ?? ""}`), total !== null ? `Subtotal dos valores anunciados: ${precoBRL(total)}. Entrega e condições de pagamento a confirmar.` : "Total a confirmar com a loja.", "Pode confirmar a disponibilidade e combinar o envio?"].join("\n\n");
  const resumo = montarResumo(linhas,total);
  const href = linkWhatsApp(resumo,whatsapp);
  const enviar = async () => {
    if (bloqueado || !whatsapp || enviando) return;
    setEnviando(true); setAvisoEnvio(""); setDestinoPronto("");
    const aba = window.open("about:blank", "_blank"); if (aba) { aba.opener = null; aba.document.title = "Conferindo seu pedido"; }
    try {
      const resposta = await fetch("/api/escolhas", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({itens:dados.sacola.map(r=>({id:r.id,tamanho:r.tamanho,cor:r.cor,quantidade:r.quantidade}))}), cache:"no-store" });
      if (!resposta.ok) throw Error("revisao");
      const revisao: {produtos:Produto[];erros:Record<string,string>} = await resposta.json();
      if (atual.current !== chave) { aba?.close(); return; }
      const novas = dados.sacola.map(r=>({linha:r,produto:revisao.produtos.find(p=>p.id===r.id),quantidade:r.quantidade}));
      const mudou = novas.some(({linha:r,produto:p}) => { const antes = catalogo.find(p=>p.id===r.id); return (antes?.preco_promocional ?? antes?.preco) !== (p?.preco_promocional ?? p?.preco); });
      setCatalogo(revisao.produtos); setErros(revisao.erros); setEstado("pronto");
      if (novas.some(({linha:r,produto:p})=>disponibilidade(p,r)||revisao.erros[JSON.stringify([r.id,r.tamanho,r.cor])])) { aba?.close(); setAvisoEnvio("A disponibilidade mudou. Revise os itens indicados."); return; }
      if (mudou) { aba?.close(); setAvisoEnvio("Um preço mudou. Confira os valores atualizados e toque em pedir novamente."); return; }
      const mensagem=await comReferencia(novas.map(({linha:r})=>({id:r.id,tamanho:r.tamanho,cor:r.cor,quantidade:r.quantidade})),montarResumo(novas,subtotal(novas)));
      if (atual.current !== chave) { aba?.close(); return; }
      const destino = linkWhatsApp(mensagem,whatsapp);
      if (aba && !aba.closed) { contarPedido(novas); aba.location.replace(destino); }
      else { setDestinoPronto(destino); setAvisoEnvio("Pedido conferido. Toque abaixo para abrir o WhatsApp."); }
    } catch { aba?.close(); setEstado("erro"); setAvisoEnvio("Não foi possível conferir o pedido. Tente novamente."); }
    finally { setEnviando(false); }
  };
  const contarPedido = (itens: typeof linhas) => {
    const medido = medirInteresse({acao:"whatsapp_sacola",origem:compacta ? origem : "/sacola",itens:itens.map(({linha:r,produto:p})=>({produto:p!.slug,tamanho:r.tamanho,cor:r.cor,quantidade:r.quantidade}))});
    if (!medido) medir({tipo:"whatsapp",botao:"peca"});
  };
  if (!habilitados[tipo]) return <section className="miolo vt-lista-escolhas"><h1>Continue explorando a loja</h1><p>Você pode escolher uma peça e pedir diretamente pelo WhatsApp.</p><Link className="btn btn--raia" href="/catalogo">Ver peças</Link></section>;
  return <section className={compacta ? "vt-lista-escolhas vt-lista-escolhas--compacta" : "miolo vt-lista-escolhas"}>{!compacta ? <div className="vt-lista-cabecalho"><div><p className="vt-sobretitulo">Suas escolhas</p><h1>{tipo === "favoritos" ? "Meus favoritos" : "Minha sacola"}</h1><p>{tipo === "favoritos" ? "As peças que você guardou para ver com calma." : "Confira suas escolhas e peça tudo pelo WhatsApp."}</p></div>{lista.length ? <button type="button" className="vt-link-discreto" onClick={() => { if (window.confirm(`Limpar ${tipo === "favoritos" ? "seus favoritos" : "a sacola"}?`)) limpar(tipo); }}>Limpar {tipo === "favoritos" ? "favoritos" : "sacola"}</button> : null}</div> : null}
    {!pronto ? <p role="status">Carregando suas escolhas…</p> : !lista.length ? <div className="vt-escolhas-vazia"><span aria-hidden="true">{tipo === "favoritos" ? "♡" : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>}</span><h2>{tipo === "favoritos" ? "Uma peça chamou sua atenção?" : "Sua próxima escolha começa aqui."}</h2><p>{tipo === "favoritos" ? "Toque no coração para guardar as peças que você quer ver depois." : "Adicione suas peças, escolha os tamanhos e envie tudo à loja pelo WhatsApp."}</p>{compacta ? <button type="button" className="btn btn--raia" onClick={continuar}>Continuar explorando</button> : <Link className="btn btn--raia" href="/catalogo">Explorar peças</Link>}</div> : tipo === "favoritos" ? <><div className={compacta ? "vt-favoritos-resumo" : "vt-favoritos-grid"}>{(compacta ? dados.favoritos.slice(0,5) : dados.favoritos).map(r => { const p = produtos.find(p => p.id === r.id); return p ? compacta ? <article key={r.id} className="vt-favorito-resumo"><Link href={`/produto/${p.slug}`}>{p.imagens[0] ? <img src={p.imagens[0].url} alt="" width="72" height="92" /> : <span className="vt-favorito-semfoto" />}<span><h3>{p.nome}</h3><strong>{precoBRL(p.preco_promocional ?? p.preco) || "Valor a confirmar"}</strong><small>Ver peça e escolher tamanho →</small></span></Link><Coracao produto={p} /></article> : <CardProduto key={r.id} produto={p as unknown as ProdutoArena} /> : <div key={r.id} className="vt-item-indisponivel"><p>Uma peça salva saiu da vitrine.</p><button type="button" onClick={() => removerFavorito(r.id)}>Remover esta referência</button></div>; })}</div>{compacta && dados.favoritos.length > 5 ? <p className="vt-favoritos-restantes">Mostrando 5 de {dados.favoritos.length} peças guardadas.</p> : null}<p className="miudo mt-8">Suas peças ficam guardadas neste navegador.</p></> : <div className="vt-sacola-layout"><div className="vt-sacola-itens">{linhas.map(({linha:r,produto:p}) => {
      const erro = disponibilidade(p,r) || erros[JSON.stringify([r.id,r.tamanho,r.cor])];
      const mudou = p && r.preco !== (p.preco_promocional ?? p.preco);
      return <article key={JSON.stringify([r.id,r.tamanho,r.cor])} className="vt-sacola-item">{p?.imagens[0] ? <Link href={`/produto/${p.slug}`}><img src={p.imagens[0].url} alt={p.nome} width="96" height="120" /></Link> : <div className="vt-sacola-semfoto" /> }<div className="vt-sacola-item__info"><h2>{p ? <Link href={`/produto/${p.slug}`}>{p.nome}</Link> : "Peça indisponível"}</h2><p>Tamanho: {r.tamanho || "a confirmar"}{r.cor ? ` · ${r.cor}` : ""}</p><strong>{p ? precoBRL(p.preco_promocional ?? p.preco) || "Valor a confirmar" : ""}</strong>{mudou ? <p className="vt-sacola-alerta">O preço mudou. Confira o valor atualizado acima.</p> : null}{erro ? <p className="vt-sacola-alerta" role="status">{erro} {p ? <Link href={`/produto/${p.slug}`}>Conferir peça</Link> : null}</p> : null}<div className="vt-sacola-item__acoes"><div className="vt-quantidade" aria-label={`Quantidade de ${p?.nome ?? "peça"}`}><button type="button" disabled={r.quantidade <= 1} onClick={() => alterar(r,r.quantidade-1)} aria-label="Diminuir quantidade">−</button><output aria-live="polite">{r.quantidade}</output><button type="button" disabled={r.quantidade >= 20 || !!erro} onClick={() => alterar(r,r.quantidade+1)} aria-label="Aumentar quantidade">+</button></div><button type="button" className="vt-link-discreto" onClick={() => alterar(r,0)}>Remover</button></div></div></article>;
    })}<Link className="vt-continuar" href="/catalogo">← Continuar escolhendo</Link></div><aside className="vt-sacola-resumo"><p className="vt-sobretitulo">Seu pedido</p><h2>{(n => `${n} ${n === 1 ? "peça escolhida" : "peças escolhidas"}`)(dados.sacola.reduce((s,r)=>s+r.quantidade,0))}</h2><div className="vt-sacola-total"><span>Subtotal anunciado</span><strong>{total !== null ? precoBRL(total) : "A confirmar"}</strong></div><p className="miudo">Entrega e condições de pagamento combinadas com a loja. A disponibilidade é confirmada no atendimento.</p>{estado === "atualizando" ? <p role="status">Conferindo suas escolhas…</p> : estado === "erro" ? <p role="alert">Não conseguimos atualizar as peças. <button type="button" className="vt-link-discreto" onClick={() => setTentativa(v => v + 1)}>Tentar novamente</button></p> : bloqueado ? <p role="status">Revise os itens indicados antes de pedir.</p> : null}{avisoEnvio ? <p role="status">{avisoEnvio}</p> : null}<a className="btn btn--raia" aria-disabled={bloqueado || !whatsapp || enviando ? true : undefined} href={bloqueado || !whatsapp ? undefined : href} target="_blank" rel="noreferrer" data-vt-pedido="sacola" onClick={e=>{e.preventDefault(); void enviar();}}>{enviando ? "Conferindo pedido…" : "Pedir pelo WhatsApp"}</a>{destinoPronto ? <a className="btn btn--raia" href={destinoPronto} target="_blank" rel="noreferrer" data-vt-pedido="sacola" onClick={()=>contarPedido(linhas)}>Abrir WhatsApp com o pedido</a> : null}<button type="button" className="vt-link-discreto" disabled={bloqueado} onClick={async () => { try { await navigator.clipboard.writeText(resumo); setCopiado(true); } catch { setCopiado(false); } }}>{copiado ? "Resumo copiado" : "Copiar resumo do pedido"}</button><p className="miudo">Suas escolhas continuam aqui ao voltar.</p></aside></div>}
  </section>;
}

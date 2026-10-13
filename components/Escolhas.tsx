"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Produto } from "@vitrine/plataforma/lib/tipos";
import { chaveLinha, lerEscolhas, vazias, type Escolhas, type LinhaSacola } from "@vitrine/plataforma/lib/escolhas";
import { prepararInteresse, medirInteresse } from "@vitrine/plataforma/estudio/lib/interesse-cliente";

type Contexto = { painel: "favoritos" | "sacola" | null; abrirPainel: (tipo: "favoritos" | "sacola") => void; fecharPainel: () => void; habilitados: { favoritos:boolean; sacola:boolean }; removerFavorito:(id:string)=>void; dados: Escolhas; pronto: boolean; produtos: Produto[]; aviso: string; favorito: (p: Produto) => void; adicionar: (p: Produto, tamanho: string, cor: string) => boolean; alterar: (linha: LinhaSacola, quantidade: number) => void; limpar: (campo: "favoritos" | "historico" | "sacola") => void; vistos: (p: Produto) => void };
const Context = createContext<Contexto | null>(null);
export function useEscolhas() { const c = useContext(Context); if (!c) throw new Error("Escolhas fora da vitrine"); return c; }
export function EscolhasProvider({ children, produtos, loja, habilitados }: { children: ReactNode; produtos: Produto[]; loja: string; habilitados:{favoritos:boolean;sacola:boolean} }) {
  const [dados, setDados] = useState<Escolhas>(vazias);
  const atual = useRef(dados);
  const [pronto, setPronto] = useState(false);
  const [aviso, setAviso] = useState("");
  const [painel, setPainel] = useState<"favoritos" | "sacola" | null>(null);
  const key = `vt-escolhas-v1:${loja}`;
  const caminho = usePathname();
  useEffect(() => { setPainel(null); }, [caminho]);
  const abrirPainel = (tipo: "favoritos" | "sacola") => { if (habilitados[tipo]) setPainel(tipo); };
  useEffect(() => {
    const restaurar = () => {
      let novo = vazias();
      try { const raw = localStorage.getItem(key); if (raw) novo = lerEscolhas(JSON.parse(raw)); } catch { setAviso("Suas escolhas ficam nesta aba enquanto o armazenamento estiver indisponível."); }
      atual.current = novo; setDados(novo); setPronto(true);
    };
    restaurar(); prepararInteresse();
    const ouvir = (e: StorageEvent) => { if (e.key === key) restaurar(); };
    window.addEventListener("storage", ouvir); return () => window.removeEventListener("storage", ouvir);
  }, [key]);
  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAviso(""), 6500); return () => clearTimeout(t); }, [aviso]);
  function guardar(proximo: Escolhas) {
    proximo = lerEscolhas(proximo);
    atual.current = proximo; setDados(proximo);
    try { localStorage.setItem(key, JSON.stringify(proximo)); } catch { setAviso("Suas escolhas ficam nesta aba. O pedido direto continua disponível."); }
  }
  function favorito(p: Produto) {
    atual.current = lerEscolhas(atual.current);
    const existe = atual.current.favoritos.some(r => r.id === p.id);
    if (!existe && atual.current.favoritos.length >= 50) { setAviso("Você já guardou 50 peças. Remova uma para salvar outra."); return; }
    guardar({ ...atual.current, favoritos: existe ? atual.current.favoritos.filter(r => r.id !== p.id) : [{ id: p.id, quando: Date.now() }, ...atual.current.favoritos] });
    setAviso(existe ? "Peça removida dos favoritos." : "Peça salva nos favoritos.");
    medirInteresse({ acao: existe ? "favorito_removido" : "favorito", produto: p.slug, origem: caminho });
  }
  function adicionar(p: Produto, tamanho: string, cor: string) {
    atual.current = lerEscolhas(atual.current);
    const linha: LinhaSacola = { id: p.id, quando: Date.now(), tamanho, cor, quantidade: 1, preco: p.preco_promocional ?? p.preco };
    const anterior = atual.current.sacola.find(r => chaveLinha(r) === chaveLinha(linha));
    if (!anterior && atual.current.sacola.length >= 20) { setAviso("Sua sacola tem 20 escolhas. Envie este pedido antes de reunir mais peças."); return false; }
    if (anterior && anterior.quantidade >= 20) { setAviso("Para mais unidades, consulte a loja pelo WhatsApp."); return false; }
    guardar({ ...atual.current, sacola: anterior ? atual.current.sacola.map(r => chaveLinha(r) === chaveLinha(linha) ? { ...r, quantidade: r.quantidade + 1, quando: Date.now() } : r) : [...atual.current.sacola, linha] });
    setAviso("Peça adicionada à sacola.");
    medirInteresse({ acao: "sacola_adicionada", produto: p.slug, tamanho, cor, quantidade: anterior ? anterior.quantidade + 1 : 1, origem: caminho }); return true;
  }
  function alterar(linha: LinhaSacola, quantidade: number) {
    if (!Number.isInteger(quantidade) || quantidade < 0 || quantidade > 20) return;
    guardar({ ...atual.current, sacola: quantidade ? atual.current.sacola.map(r => chaveLinha(r) === chaveLinha(linha) ? { ...r, quantidade, quando: Date.now() } : r) : atual.current.sacola.filter(r => chaveLinha(r) !== chaveLinha(linha)) });
    const p = produtos.find(p => p.id === linha.id);
    if (p) medirInteresse({ acao: quantidade ? "sacola_quantidade" : "sacola_removida", produto: p.slug, tamanho: linha.tamanho, cor: linha.cor, quantidade, origem: caminho });
    setAviso(quantidade ? "Quantidade atualizada." : "Peça removida da sacola.");
  }
  function vistos(p: Produto) { guardar({ ...atual.current, historico: [{ id: p.id, quando: Date.now() }, ...atual.current.historico.filter(r => r.id !== p.id)].slice(0,20) }); }
  return <Context.Provider value={{ painel, abrirPainel, fecharPainel: () => setPainel(null), habilitados, removerFavorito:id => guardar({...atual.current,favoritos:atual.current.favoritos.filter(r=>r.id!==id)}), dados, pronto, produtos, aviso, favorito, adicionar, alterar, vistos, limpar: campo => guardar({ ...atual.current, [campo]: [] }) }}>{children}<div className="vt-feedback" role="status" aria-live="polite">{aviso}{aviso === "Peça adicionada à sacola." ? <Link href="/sacola" onClick={e => { if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) { e.preventDefault(); abrirPainel("sacola"); } }}>Ver sacola →</Link> : null}</div></Context.Provider>;
}
export function Coracao({ produto }: { produto: Produto }) {
  const { dados, favorito, pronto, habilitados } = useEscolhas();
  if (!habilitados.favoritos) return null;
  const salvo = dados.favoritos.some(r => r.id === produto.id);
  return <button type="button" className="vt-coracao" aria-label={`${salvo ? "Remover dos" : "Salvar nos"} favoritos: ${produto.nome}`} aria-pressed={salvo} disabled={!pronto} onClick={() => favorito(produto)}><svg viewBox="0 0 24 24" fill={salvo ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg></button>;
}
export function Contadores() {
  const { dados, habilitados, painel, abrirPainel } = useEscolhas();
  const quantidade = dados.sacola.reduce((s,r) => s + r.quantidade, 0);
  return <div className="vt-atalhos-escolhas">{(["favoritos", "sacola"] as const).filter(tipo => habilitados[tipo]).map(tipo => {
    const total = tipo === "favoritos" ? dados.favoritos.length : quantidade;
    const nome = tipo === "favoritos" ? "Favoritos" : "Sacola";
    return <Link key={tipo} href={`/${tipo}`} aria-label={`${nome}, ${total} peças`} aria-haspopup="dialog" aria-controls="vt-painel-escolhas" aria-expanded={painel === tipo} onClick={e => {
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) { e.preventDefault(); abrirPainel(tipo); }
    }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">{tipo === "favoritos" ? <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/> : <><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></>}</svg>
      <span className="vt-atalho-nome">{nome}</span>{total ? <b>{total}</b> : null}
    </Link>;
  })}</div>;
}

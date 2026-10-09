-- MUDAR A ORDEM NUMA CHAMADA SÓ (09/10/2026, a auditoria de velocidade).
--
-- O painel gravava a ordem nova com um UPDATE por peça: numa loja de 150
-- peças, mover uma era 150 idas ao banco, uma atrás da outra. Agora é uma
-- chamada, numa transação. Sem esta função, o painel volta ao jeito antigo
-- sozinho (lib/acoes.ts), então a loja que não rodou segue funcionando.
--
-- Só o dono (0010). Reexecutável.

create or replace function reordenar(p_tabela text, p_ids uuid[], p_base int default 0)
returns int
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_mudou int;
begin
  if not eh_dono() then
    raise exception 'Sessão expirada. Entre de novo.';
  end if;
  if p_tabela not in ('produtos', 'banners') then
    raise exception 'Tabela inválida.';
  end if;
  execute format(
    'update %I t set ordem = x.i - 1 + $2 from unnest($1) with ordinality as x(id, i) where t.id = x.id',
    p_tabela
  ) using p_ids, p_base;
  get diagnostics v_mudou = row_count;
  return v_mudou;
end;
$$;

revoke all on function reordenar(text, uuid[], int) from public, anon;
grant execute on function reordenar(text, uuid[], int) to authenticated;

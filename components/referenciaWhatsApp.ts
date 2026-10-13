export async function comReferencia(itens:{id:string;tamanho:string;cor:string;quantidade:number}[],mensagem:string):Promise<string>{
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),3500);
  try{const r=await fetch("/api/solicitacao",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chave:crypto.randomUUID(),itens}),signal:abort.signal,cache:"no-store"});if(!r.ok)return mensagem;const {codigo}=await r.json();return /^VT-[A-F0-9]{12}$/.test(codigo)?mensagem+"\n\nSolicitação "+codigo:mensagem;}catch{return mensagem;}finally{clearTimeout(timer);}
}

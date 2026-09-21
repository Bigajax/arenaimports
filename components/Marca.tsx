import Image from "next/image";

/**
 * A marca da Arena: o símbolo (o A com o rasgo, dentro do arco verde) e
 * o letreiro inteiro (ARENA / IMPORTS / FLORIPA). Os dois foram
 * recortados da arte do feed com o preto virando transparência, e por
 * isso são IMAGENS coloridas (branco prata + verde), não máscaras: o
 * arco verde é parte do desenho e não pode ser pintado pela cor do
 * texto. Eles só aparecem sobre o preto, que é onde a loja os usa. O
 * símbolo sozinho fica só no favicon: em todo outro lugar a marca é o
 * letreiro com FLORIPA (pedido do André, 21/09).
 */
export function Simbolo({ altura = 28, className = "", prioridade = false }: { altura?: number; className?: string; prioridade?: boolean }) {
  return <Image src="/marca/simbolo.png" alt="" aria-hidden="true" width={Math.round(altura * (600 / 428))} height={altura} priority={prioridade} className={`inline-block shrink-0 ${className}`} />;
}

/* o letreiro ARENA / IMPORTS / FLORIPA sem o símbolo (1200 x 325): é o
   que entra ao lado do símbolo no cabeçalho. Sempre com o FLORIPA: existe
   outra Arena Imports, e o André pediu o nome inteiro em toda marca
   (21/09). O letreiro.png antigo, sem o Floripa, ficou de reserva. */
export function Letreiro({ altura = 30, className = "", prioridade = false }: { altura?: number; className?: string; prioridade?: boolean }) {
  return <Image src="/marca/letreiro-floripa.png" alt="Arena Imports Floripa" width={Math.round(altura * (1200 / 325))} height={altura} priority={prioridade} className={`inline-block shrink-0 ${className}`} />;
}

/* o letreiro completo (1200 x 749) */
export function Logo({ altura = 40, className = "", prioridade = false }: { altura?: number; className?: string; prioridade?: boolean }) {
  return <Image src="/marca/logo.png" alt="Arena Imports Floripa" width={Math.round(altura * (1200 / 749))} height={altura} priority={prioridade} className={`inline-block shrink-0 ${className}`} />;
}

/* a assinatura do estúdio, em máscara, pintada pela cor do texto */
export function MarcaEstudio({ altura, className = "" }: { altura: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label="Rafael Razeira Estúdio"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        height: altura,
        width: Math.round(altura * (956 / 519)),
        WebkitMaskImage: "url(/marca/rafael-razeira.png)",
        maskImage: "url(/marca/rafael-razeira.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

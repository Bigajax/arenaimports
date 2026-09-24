import Image from "next/image";

/**
 * A marca da Arena: a arte definitiva que o Luiz mandou em 21/09 (PNG com
 * transparência, 1516x1038), de onde saem os três arquivos: a logo inteira
 * (logo.png 1508x938), o letreiro ARENA / IMPORTS / FLORIPA sem o símbolo
 * (letreiro-floripa.png 1494x436, cortado no vão acima do ARENA) e o
 * símbolo (simbolo.png 630x486, o que cabe no círculo do arco). São IMAGENS
 * coloridas (branco + verde), não máscaras: o arco verde é parte do desenho.
 * Sempre com o FLORIPA em toda marca (existe outra Arena Imports); o
 * símbolo sozinho fica só no favicon e ao lado do letreiro no cabeçalho.
 */
export function Simbolo({ altura = 28, className = "", prioridade = false }: { altura?: number; className?: string; prioridade?: boolean }) {
  return <Image src="/marca/simbolo.png" alt="" aria-hidden="true" width={Math.round(altura * (630 / 486))} height={altura} priority={prioridade} className={`inline-block shrink-0 ${className}`} />;
}

/* o letreiro sem o símbolo (1494 x 436) */
export function Letreiro({ altura = 30, className = "", prioridade = false }: { altura?: number; className?: string; prioridade?: boolean }) {
  return <Image src="/marca/letreiro-floripa.png" alt="Arena Imports Floripa" width={Math.round(altura * (1494 / 436))} height={altura} priority={prioridade} className={`inline-block shrink-0 ${className}`} />;
}

/* o letreiro completo (1508 x 938) */
export function Logo({ altura = 40, className = "", prioridade = false }: { altura?: number; className?: string; prioridade?: boolean }) {
  return <Image src="/marca/logo.png" alt="Arena Imports Floripa" width={Math.round(altura * (1508 / 938))} height={altura} priority={prioridade} className={`inline-block shrink-0 ${className}`} />;
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

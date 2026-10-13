/**
 * A SESSÃO DO PAINEL É A DO PACOTE (13/10/2026, a Arena entra no
 * @vitrine/plataforma). A rota que continua dela (/api/yupoo)
 * pergunta pela sessão aqui, e a resposta
 * tem que ser a mesma que o layout e o login do pacote dão: com duas
 * implementações, o modo local tinha senhas e selos diferentes, e a rota
 * própria recusaria quem o pacote já tinha deixado entrar.
 */
export { exigirSessao, sessao, type Sessao } from "@vitrine/plataforma/lib/auth";

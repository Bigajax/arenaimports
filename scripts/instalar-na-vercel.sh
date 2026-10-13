#!/bin/sh
# A instalação na Vercel (13/10/2026). O @vitrine/plataforma mora num
# repositório PRIVADO, e o package-lock grava o endereço por SSH, que a
# Vercel não tem. Aqui o git troca o SSH pelo HTTPS com a GH_TOKEN (token
# fino do GitHub, só leitura do vitrine-plataforma, guardado no time da
# Vercel, aba Shared) e então instala.
#
# Mora num arquivo porque a Vercel recusa installCommand com mais de 256
# letras, e recusa calada: o deploy fica Error, sem log de build.
set -e
if [ -z "$GH_TOKEN" ]; then
  echo "Falta a GH_TOKEN nas Environment Variables do projeto: sem ela a Vercel nao baixa o @vitrine/plataforma (repositorio privado)."
  exit 1
fi
git config --global url."https://x-access-token:${GH_TOKEN}@github.com/".insteadOf ssh://git@github.com/
git config --global --add url."https://x-access-token:${GH_TOKEN}@github.com/".insteadOf git@github.com:
npm install

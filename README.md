# Hoomer — Floor Plan Editor

Aplicação de plantas em JavaScript/Canvas (2D) com exportação e recursos de visualização 3D.

## Rodar local

```bash
pnpm install
pnpm dev
```

- `pnpm dev`: recompila em watch e abre `live-server`.

## Preparar build estático (GitHub Pages)

```bash
pnpm build:pages
```

Isso gera:
- `dist/app.js` (bundle da aplicação)
- `dist/index.html` (página estática pronta para Pages, com caminho `./app.js`)
- `dist/.nojekyll`

Você também pode testar localmente:

```bash
pnpm serve:pages
```

## Deploy automático no GitHub Pages

Incluímos o workflow:

- `.github/workflows/gh-pages.yml`

Fluxo:
1. Trigger no push da branch `main` (ou execução manual).
2. Instala dependências com pnpm.
3. Roda `pnpm build:pages`.
4. Faz upload do diretório `dist`.
5. Publica no GitHub Pages.

## Observação de configuração

- No repositório do GitHub, em **Settings → Pages**, escolha **Source: GitHub Actions**.

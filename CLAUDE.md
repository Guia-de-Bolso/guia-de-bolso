# CLAUDE.md — Guia de Bolso

Este arquivo fornece contexto completo do projeto para o agente de IA. Leia antes de qualquer modificação.

**Documentação técnica para equipe (fonte única):** [`docs/README.md`](./docs/README.md) — arquitetura, APIs, banco, deploy, onboarding.

**Padrões obrigatórios de código e arquitetura:** [ENGINEERING_GUIDE.md](./ENGINEERING_GUIDE.md) (estrutura, estado, segurança, abstrações) e [CODING_STANDARDS.md](./CODING_STANDARDS.md) (nomenclatura, componentes, API, erros). Em conflito com convenções antigas neste arquivo, prevalecem os guias de engenharia.

---

## Sobre o projeto

**Guia de Bolso** é um app de descoberta local para Imbituba, Santa Catarina, Brasil. Permite que moradores e turistas encontrem praias, restaurantes, trilhas e serviços da cidade com busca por linguagem natural via IA, rotas detalhadas e navegação integrada.

**URLs:**
- Produção: https://guiadebolso.app
- Repositório: https://github.com/BrunoDislilerDev/guia-de-bolso

---

## Stack completa

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Estilização | Tailwind CSS |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| IA | Claude API (claude-sonnet-4-20250514) |
| SMS Auth | Twilio + Supabase OTP |
| Deploy | Vercel |
| Editor | Cursor |
| Linguagem | JavaScript (sem TypeScript) |

---

## Variáveis de ambiente

Arquivo `.env.local` na raiz do projeto:

```
NEXT_PUBLIC_SUPABASE_URL=https://rsdjbqzjdyeaedyqwrvc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
ANTHROPIC_API_KEY=sk-ant-...
```

As mesmas variáveis estão configuradas na Vercel em Production.

---

## Estrutura do projeto

```
guia-de-bolso/
├── app/
│   ├── page.js                  # Home page (Client Component)
│   ├── layout.js                # Layout global
│   ├── login/
│   │   └── page.js              # Tela de login (Google + SMS)
│   ├── auth/
│   │   └── callback/
│   │       └── route.js         # Callback OAuth do Supabase
│   ├── lugares/
│   │   └── [id]/
│   │       └── page.js          # Página de detalhe de cada lugar
│   ├── rotas/
│   │   ├── page.js              # Lista de rotas (requer login)
│   │   └── [id]/
│   │       └── page.js          # Detalhe de cada rota com etapas
│   ├── perfil/
│   │   └── page.js              # Perfil do usuário + configurações
│   ├── categorias/
│   │   └── page.js              # Grid de categorias e subcategorias
│   ├── admin/
│   │   ├── page.js              # Dashboard admin
│   │   ├── lugares/page.js      # CRUD de lugares
│   │   ├── avaliacoes/page.js   # Moderação de avaliações
│   │   ├── rotas/page.js        # Gestão de rotas
│   │   ├── destaques/page.js    # Gestão de destaques e planos
│   │   └── usuarios/page.js     # Gestão de usuários
│   └── api/
│       └── buscar/
│           └── route.js         # API route para busca com IA
├── lib/
│   └── supabase.js              # Cliente Supabase (SSR)
├── components/
│   ├── Onboarding.js            # Telas de onboarding (3-4 slides)
│   ├── LoginModal.js            # Bottom sheet de login para conteúdo restrito
│   ├── home/ParceirosCarrossel.js  # Carrossel de parceiros (destaques vigentes)
│   ├── BotaoIrAgora.js          # Botão que abre Maps preferido
│   └── AvaliacaoCard.js         # Card de avaliação de um lugar
├── public/
├── .env.local                   # Variáveis de ambiente (não commitado)
├── CLAUDE.md                    # Este arquivo
├── AGENTS.md                    # Instruções para agentes de IA
└── README.md                    # Documentação do projeto
```

---

## Banco de dados Supabase

**Project ID:** rsdjbqzjdyeaedyqwrvc
**Region:** us-west-2

### Tabelas existentes

**`lugares`**
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | Chave primária automática |
| nome | text | Nome do lugar |
| descricao | text | Descrição curta |
| categoria | text | Natureza, Gastronomia, Noite, Serviços, Hospedagem |
| distancia | text | Ex: "2.3km de você" (estático por enquanto) |
| imagem_url | text | URL da imagem (Supabase Storage ou Picsum) |
| destaque | bool | legado — será substituído pela tabela destaques |
| created_at | timestamp | Automático |

### Tabelas a criar

**`categorias`**
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | Chave primária |
| nome | text | Ex: Natureza |
| icone | text | Emoji ou nome do ícone |
| cor | text | Hex da cor do chip |

**`subcategorias`**
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | Chave primária |
| categoria_id | uuid | FK → categorias |
| nome | text | Ex: Praias, Trilhas, Cachoeiras |

**`perfis`**
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | = auth.users.id |
| nome | text | Nome do usuário |
| foto_url | text | URL da foto de perfil |
| role | text | user, admin |
| maps_preferido | text | google, apple, waze |
| created_at | timestamp | Automático |

**`avaliacoes`**
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | Chave primária |
| lugar_id | uuid | FK → lugares |
| user_id | uuid | FK → auth.users |
| nota | int | 1 a 5 estrelas |
| comentario | text | Texto da avaliação |
| status | text | pendente, aprovada, rejeitada |
| created_at | timestamp | Automático |

**`rotas`**
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | Chave primária |
| lugar_id | uuid | FK → lugares (opcional) |
| titulo | text | Nome da rota |
| descricao | text | Descrição geral |
| dificuldade | text | fácil, médio, difícil |
| tempo_estimado | text | Ex: "45 minutos" |
| imagem_capa | text | URL da imagem de capa |
| created_at | timestamp | Automático |

**`etapas_rota`**
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | Chave primária |
| rota_id | uuid | FK → rotas |
| ordem | int | Sequência da etapa |
| descricao | text | Instrução da etapa |
| foto_url | text | Foto opcional da etapa |

**`planos`**
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | Chave primária |
| nome | text | Básico, Padrão, Premium |
| frequencia | text | 2x semana, diário, diário premium |
| preco | numeric | Valor em reais |

**`destaques`**
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | Chave primária |
| lugar_id | uuid | FK → lugares |
| plano_id | uuid | FK → planos |
| data_inicio | date | Início do destaque |
| data_fim | date | Fim do destaque |
| ativo | bool | Controle manual pelo admin |

**`favoritos`**
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | Chave primária |
| user_id | uuid | FK → auth.users |
| lugar_id | uuid | FK → lugares |
| created_at | timestamp | Automático |

---

## Modelo de Negócio

### Planos disponíveis

**Gratuito — R$ 0**
- Cadastro no guia oficial
- Aparece nas buscas e categorias
- Recebe avaliações de turistas
- Informações básicas (nome, endereço, horário, telefone)

**Estabelecido — R$ 99/mês**
- Tudo do gratuito
- Galeria de até 10 fotos
- Link para Instagram, cardápio, site
- Descrição completa
- Badge "Estabelecimento verificado ✓"
- Aparece nas seções de categoria da home
- Estatísticas básicas de visualizações

**Destaque — R$ 149/mês**
- Tudo do Estabelecido
- Aparece no carrossel de destaques (3x por semana)
- Aparece primeiro nas buscas da categoria
- Badge "Destaque da semana"
- Estatísticas completas
- Resposta às avaliações
- Fotos ilimitadas

**Parceiro Oficial — R$ 229/mês**
- Tudo do Destaque
- Prioridade máxima no carrossel (diário, sempre primeiro)
- Badge dourado "Parceiro Oficial"
- Aparece nas rotas sugeridas pela IA
- Link direto para reserva/WhatsApp no card
- Relatório mensal de desempenho
- QR Code personalizado do estabelecimento
- Menção nas redes sociais do guia

### Contexto estratégico

- Parceria com prefeitura de Imbituba como guia turístico oficial
- Plano gratuito garante adesão em massa de todos os estabelecimentos
- Planos pagos vendem ferramentas de gestão e visibilidade
- Cobrança futura via Asaas (plataforma brasileira de pagamentos)
- Estabelecimento terá acesso próprio ao admin para gerenciar perfil e pagamentos
- QR Code do Parceiro Oficial para colocar no estabelecimento físico

### Features de pagamento (futuras)

- [ ] Portal do estabelecimento (login separado do usuário comum)
- [ ] Gestão de plano e upgrade/downgrade
- [ ] Pagamento recorrente via Asaas (PIX, boleto, cartão)
- [ ] Emissão de invoices/notas
- [ ] Relatório mensal automático por email

---

## Features implementadas ✅

- [x] Home page mobile-first com layout fiel ao design original
- [x] Chips de categoria com scroll horizontal (Natureza, Gastronomia, Noite, Serviços, Hospedagem)
- [x] Card de destaque da semana
- [x] Seção "Perto de você" com cards horizontais
- [x] Bottom navigation bar (Início, Favoritos, Perfil)
- [x] Filtro por categoria funcional
- [x] Página de detalhe de cada lugar (/lugares/[id])
- [x] Busca por linguagem natural com Claude API
- [x] 25 lugares cadastrados em 5 categorias
- [x] Imagem real da Praia da Vila via Supabase Storage
- [x] Autenticação com Google via Supabase Auth
- [x] Página de login com redirecionamento automático
- [x] Avatar do usuário logado no header
- [x] Login via SMS com Twilio (OTP de 6 dígitos)
- [x] Login via SMS com Twilio funcionando
- [x] Novo visual da página de login (foto de fundo, painel verde escuro)
- [x] Novo visual da página de login com foto de fundo
- [x] Sign in with Apple no app iOS (Capacitor) — `lib/nativeAppleAuth.js`, botão em `AuthFlow` só no iOS nativo
- [x] Google Sign-In nativo Android/iOS — `@capgo/capacitor-social-login` + `signInWithIdToken` (`lib/nativeGoogleAuth.js`, `lib/nativeSocialLoginInit.js`)
- [x] Fluxo de verificação SMS com contador de reenvio e tratamento de erros
- [x] Carrossel de destaques na home com auto-scroll e dots
- [x] Sistema de planos (Básico, Padrão, Premium) com badges visuais
- [x] Clima regional via Open-Meteo (home header + hero + detalhe Natureza/Aventura)
- [x] Geolocalização dinâmica com distância real calculada
- [x] Endereço estruturado com Google Places Autocomplete no admin
- [x] Tabela localizacoes separada com lat/lng
- [x] Subcategorias por categoria
- [x] Tags nos lugares com chips visuais
- [x] Tags incluídas no contexto da busca por IA
- [x] Cards com gradiente e altura mínima de 380px
- [x] Página de categoria com grid de lugares (`/categoria/[slug]`)
- [x] Filtro por subcategoria na página de categoria
- [x] Status aberto/fechado em tempo real
- [x] Carrossel de fotos na página de detalhe com chip 1/N
- [x] Botão de compartilhar no detalhe do lugar
- [x] Ações rápidas no detalhe (Ligar, Instagram, Cardápio, Site)
- [x] Horários de funcionamento com bottom sheet completo
- [x] Seção Localização com link para Google Maps
- [x] Seção Sobre com "Leia mais"
- [x] Botão IR AGORA com escolha de app (Google Maps, Apple Maps, Waze)
- [x] Favoritos reais salvos no Supabase
- [x] Favoritos offline automáticos (IndexedDB + rotas `/favoritos/lugar|atrativo/[id]`)
- [x] Página de favoritos com remoção de favoritos
- [x] Bottom nav com navegação ativa por rota
- [x] Página de perfil com foto, nome, email e estatísticas
- [x] Editar perfil com upload de foto via `POST /api/perfil/avatar` (`lib/avatarStorage.js`)
- [x] Upload de foto de perfil funcionando
- [x] Tela de perfil sem login com benefícios e opções de entrada
- [x] Logout com confirmação
- [x] Excluir conta com confirmação estilo Apple/Google
- [x] Preferência de app de navegação salva no localStorage
- [x] Bottom sheet de login para conteúdo restrito
- [x] Onboarding com 4 telas (praia, lagoa, montanha, cachoeira + IA/limites Premium)
- [x] Painel admin completo (`/admin`)
- [x] Dashboard com analytics e logs em tempo real
- [x] Gestão de locais com status (ativo, desativado, em_analise)
- [x] Admin com seleção de subcategoria e tags
- [x] Moderação de avaliações (aprovar/rejeitar)
- [x] Gestão de destaques e planos
- [x] Gestão de destaques no painel admin
- [x] Gestão de usuários
- [x] Sistema de logs (login, logout, favoritos, IR AGORA, visualizou_lugar, acesso ao app)
- [x] Relatórios por estabelecimento no admin (`/admin/relatorios`) com PDF e WhatsApp
- [x] QR Code por estabelecimento — URL curta `/q/{slug}`, PDF no admin, contagem de scans nos relatórios
- [x] Página `/baixar` — smart link para App Store / Play (`lib/appStoreLinks.js`); QR único em adesivos/cartazes (`docs/materiais/README.md`)
- [x] Roteiro IA com timeline (`lib/roteiroParse.js`, `RoteiroItineraryView`)
- [x] Compressão de imagem no cliente (`lib/imageCompress.js`) para avatar e fotos admin
- [x] Entrega híbrida de imagens — `RemotePhoto` (CDN direto) + `next/image` em cards de lista; `minimumCacheTTL` em `next.config.mjs`
- [x] Sistema de avaliações com moderação
- [x] Editor de horários com time picker (Fechado/24h, **dois turnos por dia**, fechamento após meia-noite, copiar entre dias — `HorarioEditor`, `lib/horarios.js`)
- [x] Testes unitários em `lib/*.test.js` (`npm test`, ~40 módulos — horários, premium, visibilidade, busca, roteiro, etc.)
- [x] Smoke E2E Playwright (`e2e/smoke.spec.js`, 10 casos; CI após build)
- [x] Checklist manual interativo (`docs/TESTING-CHECKLIST.md`, 153 casos)
- [x] Carrossel de fotos menos sensível a swipes acidentais (`lib/horizontalCarousel.js`, `LugarHero`, `RotaGaleria`)
- [x] Exclusão persistente de roteiros salvos (`DELETE /api/roteiro/[id]`, `supabase/roteiros_policies.sql`)
- [x] Tags admin: até **5** por local e rota (antes 3)
- [x] Onboarding com imagens locais (`/public/onboarding/`) e fluxo guest → login
- [x] Página de categorias (`/categorias`)
- [x] Novas categorias: Cultura, Aventura, Bem-estar, Compras
- [x] Tabela perfis com roles (user/admin)
- [x] Deploy automático na Vercel

---

## Próximos passos 🗺️

- [ ] Rotas com etapas e fotos
- [ ] WhatsApp Auth (pós aprovação Meta)

---

## Regras de acesso

| Conteúdo | Sem login | Com login |
|---|---|---|
| Ver lugares | ✅ | ✅ |
| Ver destaques | ✅ | ✅ |
| Busca por IA | ❌ → modal login | ✅ |
| Favoritar | ❌ → modal login | ✅ |
| Avaliar | ❌ → modal login | ✅ |
| Seção Rotas | ❌ → modal login | ✅ |
| Painel Admin | ❌ | ✅ (role=admin) |

---

## Design

**Paleta de cores:**
- Fundo: `#f0f4f3` (cinza clarinho)
- Verde escuro: `#1a4a3a` (botões, bottom nav, título)
- Verde menta: chip Natureza
- Bege: chip Gastronomia
- Lilás: chip Noite
- Azul claro: chip Serviços
- Dourado: chip Hospedagem

**Layout:** mobile-first, máximo ~390px de largura, centralizado no desktop

---

## Fluxo de desenvolvimento

```
Edita no Cursor → git add . → git commit -m "mensagem" → git push → Vercel atualiza automaticamente
```

**Nunca commitar o `.env.local`** — já está no `.gitignore`.

---

## Contexto do desenvolvedor

- **Nome:** Bruno Disliler
- **Background:** 4+ anos de Bubble.io (Tech Lead no WriteHuman.ai, Senior Dev no Athlytic.io)
- **Objetivo:** transição de carreira para Full Stack Developer com especialização em produtos AI-powered
- **Portfólio:** brunodisliler.com
- **GitHub:** github.com/BrunoDislilerDev
- **Este projeto é o projeto-escola da transição** — cada feature nova ensina um conceito do stack

---

## Notas importantes

- O projeto usa **JavaScript puro** (sem TypeScript) por decisão do desenvolvedor
- A busca por IA usa **todos os lugares do banco** como contexto para a Claude decidir quais retornar
- O campo `distancia` é texto estático por enquanto — geolocalização real vem depois
- O campo `destaque` na tabela lugares é legado — a lógica de destaques migrará para a tabela `destaques`
- O Apple Sign-In está ativo **somente no app iOS nativo** (Capacitor); web e Android usam Google + SMS. Config: `docs/authentication.md`, `ios/GoogleAuth.xcconfig`, `NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- A Vercel precisa ter todas as env vars configuradas em Production
- O painel Admin deve ser protegido por role = 'admin' no perfil do usuário
- Avaliações só aparecem para o usuário após aprovação pelo admin
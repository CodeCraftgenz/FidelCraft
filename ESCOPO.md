# FidelCraft - Escopo do Projeto

## Visao Geral
Plataforma SaaS de programas de fidelidade digital para comercios locais.
O lojista cria seu programa de pontos, o cliente escaneia QR code, acumula pontos e resgata premios.
Substitui o cartao fidelidade de papel por uma experiencia digital PWA.

## Publico-Alvo
- Cafeterias, padarias, acai, sorveterias
- Restaurantes, lanchonetes, pizzarias
- Barbearias, saloes de beleza
- Petshops, pet groomers
- Lojas de roupa, calcados
- Qualquer comercio local que quer fidelizar clientes

## Modelo de Negocio
| Plano       | Preco/mes | Limites                                      |
|-------------|-----------|-----------------------------------------------|
| FREE        | R$0       | 1 loja, 1 programa, 50 membros, 100 trans/mes|
| PRO         | R$49      | 1 loja, 3 programas, 500 membros, ilimitado   |
| BUSINESS    | R$99      | 3 lojas, programas ilimitados, 2000 membros   |
| ENTERPRISE  | R$199     | Ilimitado, custom domain, API, whitelabel     |

---

## Stack Tecnica (Reuso CardCraft)

### Backend
- NestJS 10 + TypeScript 5.7
- Prisma 6 + MySQL 8
- JWT + Google OAuth (reuso auth CardCraft)
- Mercado Pago SDK (PIX + Cartao)
- Nodemailer (SMTP)
- Web Push API
- Sharp (imagens)
- QRCode
- Zod (validacao)
- Helmet, Throttler, Compression

### Frontend
- React 18 + Vite 6
- TailwindCSS 3.4
- TanStack Query 5
- Framer Motion
- Lucide React (icones)
- Recharts (graficos analytics)
- React Router 7
- PWA (vite-plugin-pwa)
- Zod (validacao client)

### Infra
- Docker (MySQL 8.0)
- PM2 (producao)
- GitHub Actions CI/CD
- Cloudflare R2 (storage)
- VPS (backend) + Hostinger (frontend)

---

## Modulos e Features - MVP (v1)

### M01 - Auth (Reuso 100% CardCraft)
- [x] Registro com email/senha (lojista)
- [x] Login com JWT + refresh token
- [x] Google OAuth
- [x] 2FA (TOTP) opcional
- [x] Recuperacao de senha por email
- [x] Guards: JwtAuthGuard, RolesGuard, PlanGuard

### M02 - Perfil da Loja (Reuso 80% CardCraft)
- [ ] Pagina publica com slug (/nome-da-loja)
- [ ] Logo, nome, descricao, categoria
- [ ] Endereco com mapa (Leaflet)
- [ ] Horario de funcionamento
- [ ] Links sociais (Instagram, WhatsApp)
- [ ] Upload de imagens (R2)
- [ ] QR Code da loja

### M03 - Programas de Fidelidade (Core Feature)
- [ ] CRUD de programas (nome, descricao, tipo, regras)
- [ ] Tipos de programa:
  - **Pontos**: A cada R$X gasto = Y pontos
  - **Carimbos**: A cada compra = 1 carimbo (ex: 10 cafes = 1 gratis)
  - **Cashback**: X% do valor volta como credito
- [ ] Regras de acumulo configuravel
- [ ] Validade dos pontos (ex: 90 dias)
- [ ] Ativar/desativar programa
- [ ] Imagem/icone do programa

### M04 - Premios / Recompensas
- [ ] CRUD de premios (nome, descricao, custo em pontos, imagem)
- [ ] Estoque de premios (opcional)
- [ ] Premios ativos/inativos
- [ ] Categorias de premios
- [ ] Nivel de desbloqueio (ex: precisa ser membro Gold)

### M05 - Membros / Clientes
- [ ] Cliente se cadastra via QR code (pagina publica)
- [ ] Cadastro simplificado: nome, telefone, email
- [ ] Sem necessidade de senha (acesso por link magico ou telefone)
- [ ] Perfil do membro: pontos, historico, nivel
- [ ] Niveis/Tiers: Bronze, Prata, Ouro, Diamante (configuravel)
- [ ] Regras de progressao de nivel

### M06 - Transacoes de Pontos (Core Feature)
- [ ] Lojista registra compra -> pontos creditados
- [ ] Tela de registro rapido (valor da compra -> calcula pontos)
- [ ] QR Code scan: cliente mostra QR, lojista escaneia
- [ ] QR Code reverso: lojista mostra QR, cliente escaneia
- [ ] Resgate de premio -> pontos debitados
- [ ] Historico completo de transacoes
- [ ] Estorno de transacao (com motivo)
- [ ] Expiracao automatica de pontos (@nestjs/schedule)

### M07 - QR Code System (Reuso 90% CardCraft)
- [ ] QR Code unico por membro (para identificacao)
- [ ] QR Code unico por loja (para cadastro rapido)
- [ ] QR Code por programa (link direto)
- [ ] Leitor de QR Code na camera do celular (frontend)
- [ ] Validacao e seguranca (tokens temporarios)

### M08 - Dashboard do Lojista
- [ ] Visao geral: membros ativos, transacoes hoje, pontos emitidos
- [ ] Registrar nova transacao (tela principal)
- [ ] Lista de membros com busca/filtro
- [ ] Transacoes recentes
- [ ] Graficos de evolucao (Recharts)
- [ ] Top clientes (mais pontos, mais visitas)
- [ ] Resgates pendentes

### M09 - Dashboard do Cliente (PWA)
- [ ] Meus programas ativos
- [ ] Saldo de pontos por programa
- [ ] Historico de transacoes
- [ ] Premios disponiveis para resgate
- [ ] Meu nivel e progresso para o proximo
- [ ] QR Code pessoal (para mostrar na loja)
- [ ] Push notifications

### M10 - Analytics (Reuso 80% CardCraft)
- [ ] Membros novos por periodo
- [ ] Transacoes por periodo
- [ ] Pontos emitidos vs resgatados
- [ ] Retencao de clientes (frequencia de visita)
- [ ] Premios mais resgatados
- [ ] Receita associada ao programa
- [ ] Taxa de engajamento

### M11 - Notificacoes (Reuso 100% CardCraft)
- [ ] Email: boas-vindas, pontos creditados, premio disponivel
- [ ] Push notification: pontos proximos de expirar, novo premio, nivel up
- [ ] Central de notificacoes

### M12 - Campanhas (Feature Diferencial)
- [ ] Pontos em dobro (periodo configuravel)
- [ ] Bonus de aniversario (pontos extras no aniversario do cliente)
- [ ] Bonus de indicacao (cliente indica amigo = pontos)
- [ ] Campanhas por periodo (Natal, Black Friday, etc.)

### M13 - Multi-loja (Plano Business+)
- [ ] Organizacao com multiplas lojas
- [ ] Cada loja tem seus programas independentes
- [ ] Programa compartilhado entre lojas (opcional)
- [ ] Dashboard unificado para o dono
- [ ] Funcionarios com permissao de registrar transacoes

### M14 - Pagamentos / Billing (Reuso 90% CardCraft)
- [ ] Planos e assinatura via Mercado Pago
- [ ] PIX + Cartao
- [ ] Periodo de teste (14 dias)
- [ ] Upgrade/downgrade de plano

### M15 - PWA (Reuso 100% CardCraft)
- [ ] App instalavel (lojista e cliente)
- [ ] Icone na home screen
- [ ] Push notifications nativas
- [ ] Funciona offline (cache de dados do membro)

### M16 - Landing Page
- [ ] Hero com proposta de valor
- [ ] Como funciona (3 passos)
- [ ] Planos e precos
- [ ] Depoimentos
- [ ] CTA de cadastro
- [ ] Footer

---

## Paginas Frontend

### Area Publica
| Rota                           | Pagina                      | Acesso   |
|--------------------------------|-----------------------------|----------|
| /                              | Landing Page                | Publico  |
| /login                         | Login (lojista)             | Publico  |
| /register                      | Cadastro (lojista)          | Publico  |
| /forgot-password               | Recuperar Senha             | Publico  |
| /:slug                         | Pagina da Loja              | Publico  |
| /:slug/entrar                  | Cadastro/Login do Cliente   | Publico  |
| /membro/:token                 | Dashboard do Cliente (PWA)  | Cliente  |

### Dashboard do Lojista
| Rota                           | Pagina                      | Acesso   |
|--------------------------------|-----------------------------|----------|
| /dashboard                     | Visao Geral + Registrar     | Auth     |
| /dashboard/programas           | Gerenciar Programas         | Auth     |
| /dashboard/programas/:id       | Editar Programa             | Auth     |
| /dashboard/premios             | Gerenciar Premios           | Auth     |
| /dashboard/membros             | Lista de Membros            | Auth     |
| /dashboard/membros/:id         | Detalhe do Membro           | Auth     |
| /dashboard/transacoes          | Historico de Transacoes     | Auth     |
| /dashboard/campanhas           | Gerenciar Campanhas         | Auth     |
| /dashboard/analytics           | Metricas e Graficos         | Auth     |
| /dashboard/loja                | Editar Perfil da Loja       | Auth     |
| /dashboard/equipe              | Multi-loja (B2B)            | Auth+Plan|
| /dashboard/configuracoes       | Config Geral                | Auth     |
| /dashboard/billing             | Planos e Assinatura         | Auth     |

---

## Modelos Prisma (Database)

```prisma
// Auth & Users (Lojista)
User, RefreshToken

// Loja
Store (slug, name, description, category, logo, banner, address, lat, lng, phone, hours, theme...)

// Programas de Fidelidade
LoyaltyProgram (name, description, type[POINTS|STAMPS|CASHBACK], pointsPerCurrency, stampsToReward, cashbackPercent, pointsExpireDays, active)

// Premios
Reward (name, description, pointsCost, image, stock, active, programId)
RewardRedemption (memberId, rewardId, pointsSpent, status, redeemedAt)

// Membros (Clientes)
Member (name, email, phone, birthday, qrCodeToken, tierLevel)
MemberProgram (memberId, programId, points, stamps, totalEarned, totalSpent, joinedAt)

// Transacoes
Transaction (memberId, programId, type[EARN|REDEEM|EXPIRE|ADJUST|BONUS], points, amount, description, createdBy)

// Tiers
Tier (name, minPoints, multiplier, benefits, order, programId)

// Campanhas
Campaign (name, type[DOUBLE_POINTS|BIRTHDAY|REFERRAL|SEASONAL], multiplier, startDate, endDate, active)

// Analytics
StoreView (date, count, storeId)
EngagementEvent (type, metadata)

// Notificacoes
Notification, PushSubscription

// Multi-loja
Organization, OrganizationMember, OrganizationInvite

// Pagamentos
Payment (amount, method, status, mercadoPagoId)

// Config
SystemSetting
```

---

## Ordem de Implementacao

### Sprint 1 (Semana 1-2): Fundacao
1. Setup monorepo (backend + frontend)
2. Auth completo (reuso CardCraft)
3. Perfil da loja (CRUD + pagina publica)
4. CRUD de programas de fidelidade

### Sprint 2 (Semana 3-4): Core
5. Cadastro de membros (QR code + pagina publica)
6. Sistema de transacoes (creditar/debitar pontos)
7. QR Code scan (camera do celular)
8. Dashboard do lojista (registrar + visao geral)

### Sprint 3 (Semana 5-6): Experiencia do Cliente
9. Dashboard do membro (PWA)
10. Premios e resgate
11. Niveis/Tiers
12. Notificacoes (email + push)

### Sprint 4 (Semana 7-8): Monetizacao + Polish
13. Campanhas (pontos em dobro, aniversario, indicacao)
14. Integracao Mercado Pago (planos)
15. Analytics e metricas
16. Landing page
17. Multi-loja (B2B)

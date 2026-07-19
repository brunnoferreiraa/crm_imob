# ImobCRM

CRM imobiliário completo em português brasileiro. O projeto possui frontend Next.js e API FastAPI separados, PostgreSQL, autenticação JWT, RBAC e execução integrada pelo Docker Compose.

## Tecnologias

- Frontend: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, Zod, TanStack Query, Axios, Recharts, dnd-kit e Lucide.
- Backend: Python 3.13, FastAPI, SQLAlchemy 2, Alembic, Pydantic, Argon2, PyJWT e SlowAPI.
- Infraestrutura: PostgreSQL 17, Docker e Docker Compose.

## Módulos disponíveis

- Autenticação com login, refresh rotativo, logout, recuperação e alteração de senha.
- Usuários e RBAC: Administrador, Gerente e Corretor.
- Clientes/leads, interesses, filtros, duplicidades e CSV.
- Proprietários, imóveis, características e imagens protegidas.
- Negociações e Kanban com histórico de etapas.
- Atendimentos, visitas e tarefas.
- Dashboard e relatórios com escopo por perfil.
- Tema claro/escuro e layout responsivo.

## Requisitos

- Docker Desktop com o mecanismo Linux ativo.
- Portas livres: `3000`, `8000` e `5432`.
- Para execução sem Docker: Node.js 20.9+ e Python 3.13.

## Instalação pelo CMD do Windows

Na raiz do projeto:

```cmd
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
docker compose up --build -d
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.utils.seed
docker compose ps
```

Endereços:

- Aplicação: http://localhost:3000
- API: http://localhost:8000/api/v1
- Swagger: http://localhost:8000/docs
- Health check: http://localhost:8000/api/v1/health

O usuário inicial é definido em `backend\.env`. As credenciais de exemplo são apenas para desenvolvimento e precisam ser alteradas antes de qualquer publicação.

## Comandos de operação

```cmd
docker compose up -d
docker compose logs -f backend
docker compose logs -f frontend
docker compose down
```

Para reconstruir após alterar dependências:

```cmd
docker compose up --build -d
```

## Migrações

```cmd
docker compose exec backend alembic current
docker compose exec backend alembic upgrade head
docker compose exec backend alembic check
```

Para criar uma migração durante o desenvolvimento:

```cmd
docker compose exec backend alembic revision --autogenerate -m "descricao"
docker compose exec backend alembic upgrade head
```

## Testes e qualidade

```cmd
docker compose exec backend pytest -q
docker compose exec backend ruff check app tests alembic
cd frontend
npm.cmd run lint
npm.cmd run build
```

Os testes incluem health checks, validação de clientes, Argon2, RBAC, bloqueio administrativo para corretor, separação entre access/refresh token, rotação e impedimento de reutilização do refresh token.

### Testes E2E com Playwright

Com os containers ativos, instale o navegador uma vez e execute a suíte:

```cmd
cd frontend
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

Para abrir a interface interativa:

```cmd
npm.cmd run test:e2e:ui
```

Os testes cobrem proteção de rotas, login, logout, dashboard, navegação dos módulos e o fluxo de criação, busca e exclusão de cliente. Por padrão utilizam o administrador local. Em outro ambiente, configure `PLAYWRIGHT_BASE_URL`, `E2E_ADMIN_EMAIL` e `E2E_ADMIN_PASSWORD` antes da execução.

## Integração contínua

O workflow `.github\workflows\ci.yml` é executado em pushes e pull requests para `main` e `develop`:

- Backend: PostgreSQL 17, Ruff, migrações Alembic e Pytest.
- Frontend: instalação reproduzível, ESLint, build TypeScript e auditoria de dependências de severidade alta.
- E2E: aplicação completa em Docker Compose e 10 cenários no Chromium.

O relatório HTML do Playwright é anexado ao workflow por 14 dias, inclusive quando há falha. O Dependabot verifica semanalmente dependências npm/Python e mensalmente imagens Docker e GitHub Actions.

## Staging e produção

As imagens otimizadas usam `Dockerfile.prod`, processos não-root, health checks e build standalone do Next.js. O banco e a API não são publicados externamente no Compose de produção.

Consulte [deployment/README.md](deployment/README.md) para configuração de segredos, build, migração, seed, backup, atualização e rollback.

## Perfis e permissões

- Administrador: acesso completo, usuários, configurações e relatórios.
- Gerente: equipe, distribuição de leads, negociações e relatórios da equipe.
- Corretor: próprios leads, atendimentos, visitas, negociações e tarefas.

As permissões são sempre verificadas no backend. Ocultar elementos no frontend não concede autorização.

## Segurança

- Senhas com Argon2; nunca armazenadas em texto puro.
- Access e refresh tokens possuem tipos distintos e expiração.
- Refresh tokens são armazenados por fingerprint SHA-256, rotacionados e revogados.
- Tokens do navegador ficam em cookies HttpOnly e SameSite Lax.
- Login limitado por IP conforme `LOGIN_RATE_LIMIT`.
- CORS configurado por `FRONTEND_URL`.
- Uploads exigem autenticação, tamanho máximo e assinatura JPEG/PNG/WebP válida.
- SQLAlchemy usa parâmetros vinculados contra SQL injection.
- Exclusão lógica preserva histórico operacional.
- `.env`, uploads e artefatos locais são ignorados pelo Git.

Em desenvolvimento, a recuperação de senha devolve o token na resposta. Com `DEBUG=false`, ele não é exposto; para produção é necessário conectar um provedor de e-mail transacional.

Antes da produção, altere `SECRET_KEY`, senha do administrador, credenciais do PostgreSQL, `DEBUG=false`, URLs permitidas e use HTTPS.

## Backup do PostgreSQL

Criar backup:

```cmd
docker compose exec -T db pg_dump -U crm_user -d crm_imobiliaria > backup.sql
```

Restaurar em um banco vazio:

```cmd
type backup.sql | docker compose exec -T db psql -U crm_user -d crm_imobiliaria
```

## Estrutura

```text
backend/
  app/api/v1/endpoints/  rotas HTTP
  app/core/              configuração, segurança e permissões
  app/models/            modelos SQLAlchemy
  app/schemas/           contratos Pydantic
  app/repositories/      acesso a dados
  app/services/          regras de negócio
  alembic/               migrações
  tests/                 testes automatizados
frontend/
  src/app/               páginas e BFFs do App Router
  src/components/        componentes reutilizáveis
  src/providers/         Query e tema
  src/schemas/           validações Zod
  src/types/             tipos TypeScript
```

Datas são armazenadas em UTC e exibidas no padrão brasileiro. Valores monetários usam `Decimal/Numeric`, nunca `float`.

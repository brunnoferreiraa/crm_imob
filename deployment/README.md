# Deploy de staging e produção

Este diretório contém o modelo de variáveis para executar `docker-compose.prod.yml`. O Compose publica somente o frontend; PostgreSQL e FastAPI ficam na rede interna.

## 1. Preparar variáveis no CMD

Na raiz do projeto:

```cmd
copy deployment\.env.production.example deployment\.env.production
notepad deployment\.env.production
```

Gere uma chave segura pelo Python:

```cmd
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Substitua `SECRET_KEY`, `POSTGRES_PASSWORD`, domínio, administrador e senha. Não versione `deployment\.env.production`.

## 2. Construir e iniciar banco/backend

```cmd
docker compose --env-file deployment\.env.production -f docker-compose.prod.yml build
docker compose --env-file deployment\.env.production -f docker-compose.prod.yml up -d db backend
docker compose --env-file deployment\.env.production -f docker-compose.prod.yml exec backend alembic upgrade head
docker compose --env-file deployment\.env.production -f docker-compose.prod.yml exec backend python -m app.utils.seed
```

Após o primeiro seed, remova `INITIAL_ADMIN_PASSWORD` do arquivo e altere a senha pela aplicação.

## 3. Iniciar frontend e validar

```cmd
docker compose --env-file deployment\.env.production -f docker-compose.prod.yml up -d frontend
docker compose --env-file deployment\.env.production -f docker-compose.prod.yml ps
curl http://localhost:3000/login
```

Configure um proxy reverso externo com HTTPS para o domínio definido em `FRONTEND_URL`. Não publique diretamente PostgreSQL ou a porta interna do backend.

## Backup antes de atualização

```cmd
docker compose --env-file deployment\.env.production -f docker-compose.prod.yml exec -T db pg_dump -U crm_prod_user -d crm_imobiliaria > backup-antes-deploy.sql
```

Ajuste usuário e banco caso tenha escolhido outros nomes.

## Atualização

```cmd
docker compose --env-file deployment\.env.production -f docker-compose.prod.yml build
docker compose --env-file deployment\.env.production -f docker-compose.prod.yml up -d db backend
docker compose --env-file deployment\.env.production -f docker-compose.prod.yml exec backend alembic upgrade head
docker compose --env-file deployment\.env.production -f docker-compose.prod.yml up -d frontend
docker compose --env-file deployment\.env.production -f docker-compose.prod.yml ps
```

## Rollback

1. Volte para a imagem/revisão anterior da aplicação.
2. Consulte a revisão atual com `alembic current`.
3. Só execute downgrade se a migração tiver sido projetada e testada para isso; restaure o backup quando houver perda de compatibilidade.
4. Inicie novamente backend e frontend e execute os smoke tests.

```cmd
docker compose --env-file deployment\.env.production -f docker-compose.prod.yml logs backend
docker compose --env-file deployment\.env.production -f docker-compose.prod.yml logs frontend
```

## Checklist

- `DEBUG=false` e segredo aleatório.
- HTTPS ativo e `FRONTEND_URL` exata.
- Senha inicial removida após o seed.
- Backup e restauração testados.
- Volumes do banco e uploads incluídos na política de backup.
- CI verde e Playwright aprovado.
- Monitoramento de disponibilidade e espaço em disco configurado.

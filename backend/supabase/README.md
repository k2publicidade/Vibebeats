# VibeBeats Database Schema - Supabase

Este documento descreve o esquema completo do banco de dados do VibeBeats no Supabase.

## Visao Geral

O VibeBeats e um marketplace de beats musicais com duas categorias de usuarios:
- **Produtores**: Criam e vendem beats
- **Artistas**: Compram beats e criam projetos musicais

## Arquivos de Migracao

| Arquivo | Descricao |
|---------|-----------|
| `schema.sql` | Tabelas, indices, funcoes, triggers e RLS |
| `storage.sql` | Buckets de storage e politicas |
| `complete_migration.sql` | Arquivo combinado para execucao unica |

## Como Executar

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard/project/sjwyyxwccooyoxbzrthq)
2. Va para **SQL Editor**
3. Cole o conteudo de `complete_migration.sql`
4. Clique em **Run**

## Diagrama ER

```
+------------------+       +------------------+       +------------------+
|      users       |       |      beats       |       |    purchases     |
+------------------+       +------------------+       +------------------+
| id (PK)          |<----->| id (PK)          |<----->| id (PK)          |
| email (UNIQUE)   |       | title            |       | beat_id (FK)     |
| password_hash    |       | producer_id (FK) |------>| buyer_id (FK)    |
| name             |       | producer_name    |       | producer_id (FK) |
| user_type        |       | genre            |       | amount           |
| bio              |       | bpm              |       | license_type     |
| avatar_url       |       | key              |       | payment_method   |
| social_links     |       | description      |       | payment_status   |
| created_at       |       | price            |       | created_at       |
| updated_at       |       | license_type     |       +------------------+
+------------------+       | audio_url        |
        |                  | cover_url        |
        |                  | tags[]           |       +------------------+
        |                  | plays            |       |     projects     |
        |                  | purchases        |       +------------------+
        |                  | duration         |       | id (PK)          |
        |                  | is_active        |       | title            |
        |                  | created_at       |       | artist_id (FK)   |
        |                  +------------------+       | beat_id (FK)     |
        |                          |                  | beat_title       |
        |                          |                  | description      |
        |                          v                  | status           |
        |                  +------------------+       | notes            |
        +----------------->|    favorites     |       | created_at       |
                           +------------------+       | updated_at       |
                           | id (PK)          |       +------------------+
                           | user_id (FK)     |
                           | beat_id (FK)     |
                           | created_at       |
                           +------------------+
```

## Tabelas

### users
Armazena todos os usuarios da plataforma.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | UUID | Identificador unico (PK) |
| `email` | VARCHAR(255) | Email do usuario (UNIQUE) |
| `password_hash` | VARCHAR(255) | Hash bcrypt da senha |
| `name` | VARCHAR(255) | Nome do usuario |
| `user_type` | ENUM | 'producer' ou 'artist' |
| `bio` | TEXT | Biografia do usuario |
| `avatar_url` | TEXT | URL do avatar no storage |
| `social_links` | JSONB | Links de redes sociais |
| `created_at` | TIMESTAMPTZ | Data de criacao |
| `updated_at` | TIMESTAMPTZ | Data de atualizacao |

### beats
Armazena todos os beats cadastrados.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | UUID | Identificador unico (PK) |
| `title` | VARCHAR(255) | Titulo do beat |
| `producer_id` | UUID | FK para users |
| `producer_name` | VARCHAR(255) | Nome do produtor (denormalizado) |
| `genre` | VARCHAR(100) | Genero musical |
| `bpm` | INTEGER | Batidas por minuto (1-299) |
| `key` | VARCHAR(10) | Tom musical (C, C#, D, etc) |
| `description` | TEXT | Descricao do beat |
| `price` | DECIMAL(10,2) | Preco em reais |
| `license_type` | ENUM | 'exclusive' ou 'non_exclusive' |
| `audio_url` | TEXT | URL do audio no storage |
| `cover_url` | TEXT | URL da capa no storage |
| `tags` | TEXT[] | Array de tags |
| `plays` | INTEGER | Contador de reproducoes |
| `purchases` | INTEGER | Contador de compras |
| `duration` | VARCHAR(10) | Duracao (mm:ss) |
| `is_active` | BOOLEAN | Se esta disponivel |
| `created_at` | TIMESTAMPTZ | Data de criacao |
| `updated_at` | TIMESTAMPTZ | Data de atualizacao |

### purchases
Armazena todas as transacoes de compra.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | UUID | Identificador unico (PK) |
| `beat_id` | UUID | FK para beats |
| `beat_title` | VARCHAR(255) | Titulo do beat (denormalizado) |
| `buyer_id` | UUID | FK para users (comprador) |
| `buyer_name` | VARCHAR(255) | Nome do comprador |
| `producer_id` | UUID | FK para users (produtor) |
| `producer_name` | VARCHAR(255) | Nome do produtor |
| `amount` | DECIMAL(10,2) | Valor da compra |
| `license_type` | ENUM | Tipo de licenca |
| `payment_method` | ENUM | 'stripe', 'paypal' ou 'pix' |
| `payment_status` | ENUM | Status do pagamento |
| `transaction_id` | VARCHAR(255) | ID da transacao externa |
| `metadata` | JSONB | Metadados do pagamento |
| `created_at` | TIMESTAMPTZ | Data da compra |
| `updated_at` | TIMESTAMPTZ | Data de atualizacao |

### projects
Armazena projetos criados por artistas.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | UUID | Identificador unico (PK) |
| `title` | VARCHAR(255) | Titulo do projeto |
| `artist_id` | UUID | FK para users |
| `beat_id` | UUID | FK para beats |
| `beat_title` | VARCHAR(255) | Titulo do beat (denormalizado) |
| `description` | TEXT | Descricao do projeto |
| `status` | ENUM | 'draft', 'mixing', 'mastering', 'completed' |
| `notes` | TEXT | Notas privadas |
| `created_at` | TIMESTAMPTZ | Data de criacao |
| `updated_at` | TIMESTAMPTZ | Data de atualizacao |

### favorites
Armazena favoritos dos usuarios.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | UUID | Identificador unico (PK) |
| `user_id` | UUID | FK para users |
| `beat_id` | UUID | FK para beats |
| `created_at` | TIMESTAMPTZ | Data de criacao |

## Tipos ENUM

```sql
-- Tipo de usuario
CREATE TYPE user_type AS ENUM ('producer', 'artist');

-- Tipo de licenca
CREATE TYPE license_type AS ENUM ('exclusive', 'non_exclusive');

-- Metodo de pagamento
CREATE TYPE payment_method AS ENUM ('stripe', 'paypal', 'pix');

-- Status do pagamento
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Status do projeto
CREATE TYPE project_status AS ENUM ('draft', 'mixing', 'mastering', 'completed');
```

## Indices

### users
- `idx_users_email` - Busca por email
- `idx_users_user_type` - Filtro por tipo
- `idx_users_created_at` - Ordenacao por data

### beats
- `idx_beats_producer_id` - Busca por produtor
- `idx_beats_genre` - Filtro por genero
- `idx_beats_created_at` - Ordenacao por data
- `idx_beats_price` - Ordenacao por preco
- `idx_beats_bpm` - Filtro por BPM
- `idx_beats_plays` - Ordenacao por plays
- `idx_beats_purchases` - Ordenacao por vendas
- `idx_beats_is_active` - Filtro de ativos
- `idx_beats_license_type` - Filtro por licenca
- `idx_beats_search` - Full-text search (GIN)

### purchases
- `idx_purchases_buyer_id` - Busca por comprador
- `idx_purchases_producer_id` - Busca por produtor
- `idx_purchases_beat_id` - Busca por beat
- `idx_purchases_created_at` - Ordenacao por data
- `idx_purchases_payment_status` - Filtro por status

### projects
- `idx_projects_artist_id` - Busca por artista
- `idx_projects_beat_id` - Busca por beat
- `idx_projects_status` - Filtro por status
- `idx_projects_created_at` - Ordenacao por data
- `idx_projects_updated_at` - Ordenacao por atualizacao

### favorites
- `idx_favorites_user_id` - Busca por usuario
- `idx_favorites_beat_id` - Busca por beat
- `idx_favorites_created_at` - Ordenacao por data

## Funcoes PostgreSQL

### `update_updated_at_column()`
Atualiza automaticamente o campo `updated_at` em UPDATE.

### `increment_beat_plays(beat_uuid UUID)`
Incrementa o contador de plays de um beat.

```sql
SELECT increment_beat_plays('beat-uuid-here');
```

### `handle_purchase_completion()`
Trigger que incrementa `purchases` quando uma compra e completada.

### `get_producer_stats(producer_uuid UUID)`
Retorna estatisticas de um produtor.

```sql
SELECT * FROM get_producer_stats('producer-uuid-here');
-- Retorna: total_beats, total_plays, total_sales, total_revenue
```

### `get_artist_stats(artist_uuid UUID)`
Retorna estatisticas de um artista.

```sql
SELECT * FROM get_artist_stats('artist-uuid-here');
-- Retorna: total_purchases, total_projects, total_spent
```

### `search_beats(...)`
Busca avancada de beats com full-text search.

```sql
SELECT * FROM search_beats(
    search_query := 'trap dark',
    filter_genre := 'Hip Hop',
    filter_min_bpm := 120,
    filter_max_bpm := 160,
    filter_max_price := 100.00,
    sort_field := 'plays',
    sort_direction := 'DESC',
    page_limit := 20,
    page_offset := 0
);
```

## Triggers

| Trigger | Tabela | Acao |
|---------|--------|------|
| `trigger_users_updated_at` | users | Atualiza updated_at |
| `trigger_beats_updated_at` | beats | Atualiza updated_at |
| `trigger_purchases_updated_at` | purchases | Atualiza updated_at |
| `trigger_projects_updated_at` | projects | Atualiza updated_at |
| `trigger_purchase_completed` | purchases | Incrementa purchases no beat |

## Row Level Security (RLS)

### users
- SELECT: Todos podem ver perfis publicos
- UPDATE: Apenas o proprio usuario
- INSERT: Apenas durante registro

### beats
- SELECT: Todos veem beats ativos; produtor ve seus inativos
- INSERT: Apenas produtores
- UPDATE: Apenas o produtor dono
- DELETE: Apenas o produtor dono

### purchases
- SELECT: Comprador ve suas compras; produtor ve suas vendas
- INSERT: Apenas artistas
- UPDATE: Apenas sistema (service role)

### projects
- SELECT: Apenas o artista dono
- INSERT: Apenas artistas com beat comprado
- UPDATE: Apenas o artista dono
- DELETE: Apenas o artista dono

### favorites
- SELECT: Apenas o usuario dono
- INSERT: Apenas o usuario dono
- DELETE: Apenas o usuario dono

## Storage Buckets

| Bucket | Publico | Limite | Tipos |
|--------|---------|--------|-------|
| `avatars` | Sim | 5MB | image/* |
| `covers` | Sim | 10MB | image/* |
| `audio` | Sim | 50MB | audio/* |
| `audio-downloads` | Nao | 100MB | audio/*, zip |

### Estrutura de Pastas

```
avatars/
  {user_id}/
    avatar.png

covers/
  {producer_id}/
    {beat_id}.png

audio/
  {producer_id}/
    {beat_id}.mp3

audio-downloads/
  {producer_id}/
    {beat_id}/
      stems.zip
      master.wav
```

## Exemplos de Queries

### Listar beats mais populares
```sql
SELECT * FROM beats
WHERE is_active = TRUE
ORDER BY plays DESC
LIMIT 10;
```

### Buscar beats por termo
```sql
SELECT * FROM search_beats('trap melodic', NULL, NULL, NULL, NULL, 'plays', 'DESC', 20, 0);
```

### Obter estatisticas do produtor
```sql
SELECT * FROM get_producer_stats('producer-uuid');
```

### Verificar se usuario comprou beat
```sql
SELECT EXISTS(
    SELECT 1 FROM purchases
    WHERE buyer_id = 'user-uuid'
    AND beat_id = 'beat-uuid'
    AND payment_status = 'completed'
);
```

### Listar favoritos do usuario
```sql
SELECT b.* FROM beats b
JOIN favorites f ON f.beat_id = b.id
WHERE f.user_id = 'user-uuid'
ORDER BY f.created_at DESC;
```

## Consideracoes de Performance

1. **Denormalizacao**: Campos como `producer_name`, `beat_title` sao duplicados para evitar JOINs frequentes.

2. **Indices GIN**: O indice de full-text search usa GIN para busca eficiente em titulo, descricao e tags.

3. **Indices parciais**: O indice `idx_beats_is_active` so indexa beats ativos.

4. **Paginacao**: Use `search_beats()` com `page_limit` e `page_offset` para paginacao eficiente.

## Seguranca

1. **RLS habilitado** em todas as tabelas
2. **Senhas hasheadas** com bcrypt
3. **Service role** necessario para operacoes administrativas
4. **Bucket privado** para downloads de audio de alta qualidade
5. **Validacao de compra** antes de criar projetos

## Proximos Passos

1. Configurar integracao com Stripe/PayPal para pagamentos
2. Implementar webhooks para notificacoes
3. Adicionar tabela de `notifications`
4. Implementar sistema de reviews/ratings
5. Adicionar analytics de reproducoes

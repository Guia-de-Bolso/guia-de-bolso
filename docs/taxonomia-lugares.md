# Taxonomia de lugares — subcategorias vs tags

## Regra

| Camada | O que é | Exemplo (Natureza) |
|--------|---------|-------------------|
| **Categoria** | Grupo fixo no app | Natureza |
| **Subcategoria** | **Tipo** do lugar (filtro na página da categoria) | Praias, Trilhas, Cachoeiras |
| **Tags** (máx. 5) | **Atributos** e experiência | Surfe, Pôr do sol imperdível, Mar agitado |

Não crie subcategoria para coisas que já são tag (Surfe, pôr do sol, mergulho, romântico, pet friendly, etc.).

## Subcategorias canônicas

Definidas em `supabase/taxonomia_lugares_cleanup.sql`.

### Natureza
Praias · Trilhas · Cachoeiras · Mirantes · Lagoas · Parques · Piscinas naturais · Dunas · Ilhas

### Gastronomia
Restaurantes · Cafés · Bares · Padarias · Sorveterias · Empório Gourmet

**Tags de tipo de comida (Restaurantes):** especialidade culinária — ex. Pizza, Sushi, Hambúrguer, Rodízio, Massas, Cozinha italiana/japonesa, Churrasco, Por kilo, Prato feito. Seed: `supabase/tags_gastronomia_tipos_comida.sql`. Tags genéricas (Frutos do mar, Comida local, Vegano/Vegetariano, Delivery) continuam válidas junto com as de especialidade (máx. 5 por lugar).

**Tags de emporium (Empório Gourmet):** Vinhos, Delicatessen, Vinhos importados, Cervejas artesanais, Chocolates importados, Presentes sofisticados, Tábuas de frios, Degustação, Experiência gastronômica, etc. Seed: `supabase/tags_gastronomia_emporio_gourmet.sql`.

### Noite
Bares · Baladas · Pubs

### Serviços
Farmácias · Mercados · Mecânicos · Salões · Saúde

### Cultura
Museus · Monumentos · Igrejas e templos · Eventos

### Aventura
Esportes radicais · Passeios de barco · Escalada · Ciclismo

### Bem-estar
Spa · Yoga · Terapias

> **Removidas do produto:** Hospedagem (Pousadas/Hostels/Hotéis) e Compras (Lojas/Feiras/Artesanato). SQL: `supabase/remover_categorias_compras_hospedagem.sql`.

## Tags novas (detalhes)

Incluídas no mesmo SQL, entre outras: **Surfe**, Stand-up paddle, Bodyboard, Costão, Praia paradisíaca, Frutos do mar, Happy hour, Patrimônio histórico, etc.

Tags que já existiam e cobrem o caso: **Pôr do sol imperdível**, **Nascer do sol**, **Ótimo para mergulho**, **Vista para o mar**, **Mar agitado** / **Mar calmo**.

## Cadastro no admin

**Dia a dia:** use **`/admin/taxonomia`** to add, rename, or retire subcategorias and tags (with usage guards and place migration on rename). No SQL required for routine edits.

**Tags no banco:** cada tag tem `subcategorias` (jsonb) — lista de `{ categoria, nome }` onde ela aparece. O campo `categorias` é mantido para compatibilidade e rotas. Bootstrap: `supabase/tags_subcategorias.sql`.

**Formulário de lugar** (`/admin/locais`):

1. Categoria → ex. Natureza  
2. Subcategoria → ex. **Praias** (não “Surf”)  
3. Tags → só então aparecem checkboxes; ex. **Surfe** + **Pôr do sol imperdível** + **Mar agitado** (máx. **5** selecionadas)

**Taxonomia → Tags:** vincule a tag às **subcategorias** (não só à categoria ampla).

Tags com **`aplica_em_rotas`** also appear on route forms after `supabase/rotas_taxonomia.sql`.

## Aplicar no Supabase (bootstrap)

Rode `supabase/taxonomia_lugares_cleanup.sql` no SQL Editor (idempotente) em ambientes novos ou para reset canônico. Depois, mantenha o vocabulário via `/admin/taxonomia`.

-- Parceiros sem "Onde atende" preenchido (só leitura, não altera nada).
-- Junta quem tem ficha em fornecedores_metadata com quem só aparece
-- como fornecedor de alguma experiência.
with nomes as (
  select fornecedor_nome as nome from public.fornecedores_metadata
  union
  select fornecedor_nome from public.experiences where fornecedor_nome is not null
  union
  select fornecedor_nome from public.experience_suppliers where fornecedor_nome is not null
),
parceiros as (
  select distinct on (lower(regexp_replace(trim(nome), '\s+', ' ', 'g')))
    lower(regexp_replace(trim(nome), '\s+', ' ', 'g')) as chave,
    trim(nome) as nome
  from nomes
  where trim(coalesce(nome, '')) <> ''
    and lower(trim(nome)) <> 'a definir'
)
select
  p.nome                                   as parceiro,
  coalesce(m.status, '(sem ficha)')        as status,
  m.categoria,
  (select count(*) from public.experiences e
     where lower(regexp_replace(trim(e.fornecedor_nome), '\s+', ' ', 'g')) = p.chave
       and e.is_active is not false)       as experiencias_ativas
from parceiros p
left join public.fornecedores_metadata m on m.fornecedor_key = p.chave
where m.local_atendimento is null
order by experiencias_ativas desc, p.nome;

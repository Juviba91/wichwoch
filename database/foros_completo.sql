-- ─── 1. Añadir slug a watches (si no existe) ─────────────────────────────────
alter table public.watches add column if not exists slug text unique;
alter table public.watches add column if not exists brand_slug text;
alter table public.watches add column if not exists specs jsonb;

-- ─── 2. Tabla de páginas de marca ────────────────────────────────────────────
create table if not exists public.brand_pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  country text,
  founded int,
  description text,
  website text,
  created_at timestamptz default now()
);

-- ─── 3. Tabla de novedades de marca ──────────────────────────────────────────
create table if not exists public.brand_news (
  id uuid primary key default gen_random_uuid(),
  brand_slug text not null references public.brand_pages(slug) on delete cascade,
  watch_id uuid references public.watches(id),
  author_id uuid references public.profiles(id),
  title text not null,
  content text not null,
  owners_only boolean default false,
  created_at timestamptz default now()
);

-- ─── 4. Tablas de foros (si no existen) ──────────────────────────────────────
create table if not exists public.watch_pages (
  id uuid primary key default gen_random_uuid(),
  watch_id uuid references public.watches(id) on delete cascade unique,
  title text,
  description text,
  history text,
  specs jsonb,
  generated_by_ai boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  watch_id uuid references public.watches(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  votes int default 0,
  replies_count int default 0,
  is_news boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.forum_threads(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  votes int default 0,
  created_at timestamptz default now()
);

create table if not exists public.thread_votes (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.forum_threads(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  value int check (value in (1, -1)),
  created_at timestamptz default now(),
  unique(thread_id, user_id)
);

create table if not exists public.reply_votes (
  id uuid primary key default gen_random_uuid(),
  reply_id uuid references public.forum_replies(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  value int check (value in (1, -1)),
  created_at timestamptz default now(),
  unique(reply_id, user_id)
);

-- ─── 5. RLS ───────────────────────────────────────────────────────────────────
alter table public.brand_pages enable row level security;
alter table public.brand_news enable row level security;
alter table public.watch_pages enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_replies enable row level security;
alter table public.thread_votes enable row level security;
alter table public.reply_votes enable row level security;

create policy "Brand pages public" on public.brand_pages for select using (true);
create policy "Brand news public" on public.brand_news for select using (true);
create policy "Auth can post news" on public.brand_news for insert with check (auth.uid() = author_id);
create policy "Watch pages public" on public.watch_pages for select using (true);
create policy "Watch pages insert" on public.watch_pages for insert with check (true);
create policy "Watch pages update" on public.watch_pages for update using (true);
create policy "Threads public" on public.forum_threads for select using (true);
create policy "Auth can create threads" on public.forum_threads for insert with check (auth.uid() = author_id);
create policy "Replies public" on public.forum_replies for select using (true);
create policy "Auth can reply" on public.forum_replies for insert with check (auth.uid() = author_id);
create policy "Thread votes public" on public.thread_votes for select using (true);
create policy "Auth can vote threads" on public.thread_votes for insert with check (auth.uid() = user_id);
create policy "Auth can change thread vote" on public.thread_votes for delete using (auth.uid() = user_id);
create policy "Reply votes public" on public.reply_votes for select using (true);
create policy "Auth can vote replies" on public.reply_votes for insert with check (auth.uid() = user_id);
create policy "Auth can change reply vote" on public.reply_votes for delete using (auth.uid() = user_id);

-- ─── 6. Fix RLS watches ───────────────────────────────────────────────────────
drop policy if exists "Brands can add watches" on public.watches;
drop policy if exists "Auth users can add watches" on public.watches;
drop policy if exists "Auth users can update watches" on public.watches;
create policy "Auth users can add watches" on public.watches for insert with check (auth.uid() is not null);
create policy "Auth users can update watches" on public.watches for update using (auth.uid() is not null);

-- ─── 7. Triggers ──────────────────────────────────────────────────────────────
create or replace function update_replies_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then update forum_threads set replies_count = replies_count + 1 where id = NEW.thread_id;
  elsif TG_OP = 'DELETE' then update forum_threads set replies_count = replies_count - 1 where id = OLD.thread_id;
  end if; return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_reply_change on forum_replies;
create trigger on_reply_change after insert or delete on forum_replies for each row execute procedure update_replies_count();

create or replace function update_thread_votes()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then update forum_threads set votes = votes + NEW.value where id = NEW.thread_id;
  elsif TG_OP = 'DELETE' then update forum_threads set votes = votes - OLD.value where id = OLD.thread_id;
  end if; return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_thread_vote_change on thread_votes;
create trigger on_thread_vote_change after insert or delete on thread_votes for each row execute procedure update_thread_votes();

create or replace function update_reply_votes()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then update forum_replies set votes = votes + NEW.value where id = NEW.reply_id;
  elsif TG_OP = 'DELETE' then update forum_replies set votes = votes - OLD.value where id = OLD.reply_id;
  end if; return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_reply_vote_change on reply_votes;
create trigger on_reply_vote_change after insert or delete on reply_votes for each row execute procedure update_reply_votes();

-- ─── 8. Marcas ────────────────────────────────────────────────────────────────
insert into public.brand_pages (slug, name, country, founded, description, website) values
('rolex',  'Rolex',            'Suiza',    1905, 'Fundada en Londres en 1905 por Hans Wilsdorf. Sinónimo de precisión, durabilidad y lujo atemporal. Fabricante independiente con sede en Ginebra.', 'https://rolex.com'),
('omega',  'Omega',            'Suiza',    1848, 'Fundada en La Chaux-de-Fonds en 1848. Relojero oficial de los Juegos Olímpicos y primer reloj en la Luna. Parte del grupo Swatch.', 'https://omegawatches.com'),
('patek',  'Patek Philippe',   'Suiza',    1839, 'La manufactura independiente más antigua de Ginebra. Cada reloj fabricado íntegramente en sus talleres. Símbolo de herencia familiar y complicaciones supremas.', 'https://patek.com'),
('ap',     'Audemars Piguet',  'Suiza',    1875, 'Fundada en Le Brassus, Valle de Joux. Cuna del Royal Oak, el primer deportivo de lujo en acero. Manufactura independiente en manos de las familias fundadoras.', 'https://audemarspiguet.com'),
('iwc',    'IWC Schaffhausen', 'Suiza',    1868, 'Fundada en Schaffhausen en 1868 por el ingeniero americano Florentine Ariosto Jones. Especialistas en relojes de piloto y complicaciones de ingeniería.', 'https://iwc.com'),
('jlc',    'Jaeger-LeCoultre', 'Suiza',    1833, 'Fundada en Le Sentier en 1833 por Antoine LeCoultre. La "Grande Maison" del Valle de Joux. Más de 1.400 calibres propios y 400 complicaciones.', 'https://jaeger-lecoultre.com'),
('tudor',  'Tudor',            'Suiza',    1926, 'Fundada por Hans Wilsdorf en 1926 como alternativa accesible a Rolex. Misma fiabilidad, diseño icónico, precio más asequible. Independiente desde 2013.', 'https://tudorwatch.com')
on conflict (slug) do nothing;

-- ─── 9. Relojes con specs reales ─────────────────────────────────────────────
insert into public.watches (model, reference, year, slug, brand_slug, specs) values

-- ROLEX
('Submariner', '126610LN', 2020, 'rolex_submariner', 'rolex',
 '{"diametro":"41 mm","movimiento":"Cal. 3235 (automático)","reserva_marcha":"70 horas","resistencia_agua":"300 m","cristal":"Zafiro con antirreflejo","brazalete":"Oyster con cierre Oysterlock","bisel":"Cerachrom negro unidireccional"}'::jsonb),

('Daytona', '116500LN', 2016, 'rolex_daytona', 'rolex',
 '{"diametro":"40 mm","movimiento":"Cal. 4130 (automático)","reserva_marcha":"72 horas","resistencia_agua":"100 m","cristal":"Zafiro con antirreflejo","brazalete":"Oyster con cierre Oysterclasp","bisel":"Cerachrom negro/blanco"}'::jsonb),

('GMT-Master II', '126710BLNR', 2019, 'rolex_gmt_master_ii', 'rolex',
 '{"diametro":"40 mm","movimiento":"Cal. 3285 (automático)","reserva_marcha":"70 horas","resistencia_agua":"100 m","cristal":"Zafiro con antirreflejo","brazalete":"Jubilee con cierre Easylink","bisel":"Cerachrom azul/negro (Pepsi)"}'::jsonb),

('Datejust', '126200', 2020, 'rolex_datejust', 'rolex',
 '{"diametro":"36 mm","movimiento":"Cal. 3235 (automático)","reserva_marcha":"70 horas","resistencia_agua":"100 m","cristal":"Zafiro con antirreflejo","brazalete":"Jubilee o Oyster","bisel":"Acero liso o estriado"}'::jsonb),

('Explorer', '124270', 2021, 'rolex_explorer', 'rolex',
 '{"diametro":"36 mm","movimiento":"Cal. 3230 (automático)","reserva_marcha":"70 horas","resistencia_agua":"100 m","cristal":"Zafiro con antirreflejo","brazalete":"Oyster con cierre Oysterlock","esfera":"Negra con índices luminiscentes"}'::jsonb),

-- OMEGA
('Speedmaster Moonwatch', '310.30.42.50.01.001', 2021, 'omega_speedmaster', 'omega',
 '{"diametro":"42 mm","movimiento":"Cal. 3861 (manual)","reserva_marcha":"50 horas","resistencia_agua":"50 m","cristal":"Zafiro doble cara con antirreflejo","brazalete":"Acero con cierre desplegable","certificacion":"METAS Master Chronometer"}'::jsonb),

('Seamaster 300M', '210.30.42.20.01.001', 2018, 'omega_seamaster_300m', 'omega',
 '{"diametro":"42 mm","movimiento":"Cal. 8800 (automático)","reserva_marcha":"55 horas","resistencia_agua":"300 m","cristal":"Zafiro con antirreflejo","brazalete":"Acero con cierre desplegable","bisel":"Cerámica unidireccional"}'::jsonb),

('Constellation', '131.10.39.20.02.001', 2020, 'omega_constellation', 'omega',
 '{"diametro":"39 mm","movimiento":"Cal. 8700 (automático)","reserva_marcha":"55 horas","resistencia_agua":"100 m","cristal":"Zafiro con antirreflejo","brazalete":"Acero Broderie","diseno":"Griffes características en la caja"}'::jsonb),

('De Ville Prestige', '424.10.40.20.02.001', 2019, 'omega_de_ville', 'omega',
 '{"diametro":"40 mm","movimiento":"Cal. 8500 (automático)","reserva_marcha":"60 horas","resistencia_agua":"30 m","cristal":"Zafiro con antirreflejo","brazalete":"Acero pulido","diseno":"Estilo dress watch clásico"}'::jsonb),

-- PATEK PHILIPPE
('Nautilus', '5711/1A-010', 2021, 'patek_nautilus', 'patek',
 '{"diametro":"40 mm","movimiento":"Cal. 26-330 S C (automático)","reserva_marcha":"45 horas","resistencia_agua":"120 m","cristal":"Zafiro","brazalete":"Acero integrado","diseno":"Diseñado por Gérald Genta en 1976. Descatalogado en 2021."}'::jsonb),

('Aquanaut', '5167A-001', 2021, 'patek_aquanaut', 'patek',
 '{"diametro":"40 mm","movimiento":"Cal. 324 S C (automático)","reserva_marcha":"45 horas","resistencia_agua":"120 m","cristal":"Zafiro","correa":"Caucho tropical compuesto","diseno":"Bisel octogonal redondeado, esfera en relieve"}'::jsonb),

('Calatrava', '5196P-001', 2019, 'patek_calatrava', 'patek',
 '{"diametro":"37 mm","movimiento":"Cal. 215 PS (manual)","reserva_marcha":"44 horas","resistencia_agua":"25 m","cristal":"Zafiro","correa":"Cuero de aligátor","diseno":"El dress watch por excelencia. Platino 950."}'::jsonb),

-- AUDEMARS PIGUET
('Royal Oak', '15500ST.OO.1220ST.01', 2019, 'ap_royal_oak', 'ap',
 '{"diametro":"41 mm","movimiento":"Cal. 4302 (automático)","reserva_marcha":"70 horas","resistencia_agua":"50 m","cristal":"Zafiro","brazalete":"Acero integrado","diseno":"Diseñado por Gérald Genta en 1972. Bisel octogonal con tornillos."}'::jsonb),

('Royal Oak Offshore', '26400SO.OO.A002CA.01', 2020, 'ap_royal_oak_offshore', 'ap',
 '{"diametro":"44 mm","movimiento":"Cal. 3126/3840 (automático)","reserva_marcha":"60 horas","resistencia_agua":"100 m","cristal":"Zafiro","correa":"Caucho naranja","diseno":"Versión sport extremo del Royal Oak. Cronógrafo."}'::jsonb),

('Code 11.59', '15210BC.OO.A002KB.01', 2019, 'ap_code_1159', 'ap',
 '{"diametro":"41 mm","movimiento":"Cal. 4302 (automático)","reserva_marcha":"70 horas","resistencia_agua":"50 m","cristal":"Zafiro doble curvado","brazalete":"Oro blanco","diseno":"Diseño contemporáneo con caja de doble curva."}'::jsonb),

-- IWC
('Portugieser', 'IW500705', 2019, 'iwc_portugieser', 'iwc',
 '{"diametro":"42 mm","movimiento":"Cal. 52010 (automático)","reserva_marcha":"7 días","resistencia_agua":"30 m","cristal":"Zafiro","correa":"Cuero de aligátor","diseno":"Esfera minimalista, indicador de reserva de marcha."}'::jsonb),

('Pilot Mark XX', 'IW328001', 2022, 'iwc_pilot_mark_xx', 'iwc',
 '{"diametro":"40 mm","movimiento":"Cal. 35111 (automático)","reserva_marcha":"42 horas","resistencia_agua":"60 m","cristal":"Zafiro antirreflejo","correa":"Cuero de becerro","diseno":"Legible, funcional. Corona protegida. Herencia aviación."}'::jsonb),

-- JAEGER-LECOULTRE
('Reverso Classic', 'Q2788570', 2021, 'jlc_reverso', 'jlc',
 '{"diametro":"45.6 x 27.4 mm","movimiento":"Cal. 822/2 (manual)","reserva_marcha":"42 horas","resistencia_agua":"30 m","cristal":"Zafiro","correa":"Cuero de aligátor","diseno":"Caja Art Déco reversible. Creado para el polo en 1931."}'::jsonb),

('Master Ultra Thin', 'Q1348420', 2020, 'jlc_master_ultra_thin', 'jlc',
 '{"diametro":"39 mm","movimiento":"Cal. 849 (manual)","reserva_marcha":"33 horas","resistencia_agua":"30 m","cristal":"Zafiro","correa":"Cuero de aligátor","diseno":"Uno de los movimientos más delgados del mundo. 1.85 mm."}'::jsonb),

-- TUDOR
('Black Bay', '79230N', 2018, 'tudor_black_bay', 'tudor',
 '{"diametro":"41 mm","movimiento":"Cal. MT5602 (automático)","reserva_marcha":"70 horas","resistencia_agua":"200 m","cristal":"Zafiro con antirreflejo","brazalete":"Acero o tela","diseno":"Inspirado en el Submariner original de 1958. Corona grande."}'::jsonb)

on conflict (slug) do nothing;

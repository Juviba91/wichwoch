-- ─── Añadir slug a watches ───────────────────────────────────────────────────
alter table public.watches add column if not exists slug text unique;

-- ─── 20 Relojes icónicos ─────────────────────────────────────────────────────
insert into public.watches (model, reference, year, slug) values
('Submariner', '126610LN', 2020, 'rolex_submariner'),
('Daytona', '116500LN', 2016, 'rolex_daytona'),
('GMT-Master II', '126710BLNR', 2019, 'rolex_gmt_master_ii'),
('Datejust', '126200', 2020, 'rolex_datejust'),
('Explorer', '124270', 2021, 'rolex_explorer'),
('Speedmaster Moonwatch', '310.30.42.50.01.001', 2021, 'omega_speedmaster'),
('Seamaster 300M', '210.30.42.20.01.001', 2018, 'omega_seamaster_300m'),
('Constellation', '131.10.39.20.02.001', 2020, 'omega_constellation'),
('De Ville Prestige', '424.10.40.20.02.001', 2019, 'omega_de_ville'),
('Nautilus', '5711/1A-010', 2021, 'patek_nautilus'),
('Aquanaut', '5167A-001', 2021, 'patek_aquanaut'),
('Calatrava', '5196P-001', 2019, 'patek_calatrava'),
('Royal Oak', '15500ST.OO.1220ST.01', 2019, 'ap_royal_oak'),
('Royal Oak Offshore', '26400SO.OO.A002CA.01', 2020, 'ap_royal_oak_offshore'),
('Code 11.59', '15210BC.OO.A002KB.01', 2019, 'ap_code_1159'),
('Portugieser', 'IW500705', 2019, 'iwc_portugieser'),
('Pilot Mark XX', 'IW328001', 2022, 'iwc_pilot_mark_xx'),
('Reverso Classic', 'Q2788570', 2021, 'jlc_reverso'),
('Master Ultra Thin', 'Q1348420', 2020, 'jlc_master_ultra_thin'),
('Black Bay', '79230N', 2018, 'tudor_black_bay')
on conflict (slug) do nothing;

-- ─── Fix RLS para que usuarios autenticados puedan insertar watches ──────────
drop policy if exists "Brands can add watches" on public.watches;
drop policy if exists "Auth users can add watches" on public.watches;
drop policy if exists "Auth users can update watches" on public.watches;
create policy "Auth users can add watches" on public.watches for insert with check (auth.uid() is not null);
create policy "Auth users can update watches" on public.watches for update using (auth.uid() is not null);

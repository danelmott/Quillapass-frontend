#!/usr/bin/env python3
"""Genera supabase/seed.sql (D8 + D9) para la demo de CiviLoop / QuillaPass.

Datos geográficos: OpenStreetMap vía Nominatim (© colaboradores de OpenStreetMap, ODbL).
- Distrito, localidades y Gran Malecón: polígonos reales simplificados (scripts/geo/zones_barranquilla.json).
- Barrios: polígonos aproximados = celdas de Voronoi de los centros de barrio recortadas a 900 m.
- Lugares: coordenadas de Nominatim. Los comercios y sus productos son ficticios (demostración).

Uso:  python3 supabase/scripts/build_seed.py > supabase/seed.sql
"""
import json
import pathlib

HERE = pathlib.Path(__file__).parent
ZONES = json.loads((HERE / 'geo' / 'zones_barranquilla.json').read_text())


def q(s):
    return 'null' if s is None else "'" + str(s).replace("'", "''") + "'"


def j(obj):
    return q(json.dumps(obj, ensure_ascii=False, separators=(',', ':'))) + '::jsonb'


def t3(es, en, pt):
    return {'es': es, 'en': en, 'pt': pt}


DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']


def hours(open_, close, days=DAYS):
    return {d: [[open_, close]] for d in days}


def arr(items):
    return 'array[' + ','.join(q(i) for i in items) + ']::text[]'


out = []
w = out.append

w("""-- =====================================================================================
-- Seed de la demo CiviLoop / QuillaPass (D8 + D9). Generado por supabase/scripts/build_seed.py
-- Datos geográficos © colaboradores de OpenStreetMap (ODbL). Comercios y productos: ficticios.
-- =====================================================================================
begin;
do $$ begin
  if exists (select 1 from public.zones) then raise exception 'El seed ya fue aplicado (hay zonas)'; end if;
end $$;
""")

# ------------------------------------------------------------------ catálogos
interests = [
    ('cultura', t3('Cultura', 'Culture', 'Cultura'), 'theater'),
    ('historia', t3('Historia', 'History', 'História'), 'landmark'),
    ('arte', t3('Arte', 'Art', 'Arte'), 'palette'),
    ('musica', t3('Música', 'Music', 'Música'), 'music'),
    ('gastronomia', t3('Gastronomía', 'Food', 'Gastronomia'), 'utensils'),
    ('naturaleza', t3('Naturaleza', 'Nature', 'Natureza'), 'tree'),
    ('familia', t3('Planes en familia', 'Family', 'Família'), 'users'),
    ('futbol', t3('Fútbol', 'Football', 'Futebol'), 'soccer'),
    ('deporte', t3('Deporte', 'Sports', 'Esporte'), 'running'),
    ('compras', t3('Compras', 'Shopping', 'Compras'), 'bag'),
    ('arquitectura', t3('Arquitectura', 'Architecture', 'Arquitetura'), 'building'),
]
w('insert into public.interests (slug, name_i18n, icon) values\n  ' + ',\n  '.join(
    f'({q(s)}, {j(n)}, {q(i)})' for s, n, i in interests) + ';\n')

features = [
    ('silla_ruedas', t3('Silla de ruedas', 'Wheelchair', 'Cadeira de rodas')),
    ('movilidad_reducida', t3('Movilidad reducida', 'Reduced mobility', 'Mobilidade reduzida')),
    ('baja_vision', t3('Baja visión', 'Low vision', 'Baixa visão')),
    ('auditiva', t3('Discapacidad auditiva', 'Hearing impairment', 'Deficiência auditiva')),
    ('cognitiva', t3('Discapacidad cognitiva', 'Cognitive disability', 'Deficiência cognitiva')),
]
w('insert into public.accessibility_features (slug, name_i18n) values\n  ' + ',\n  '.join(
    f'({q(s)}, {j(n)})' for s, n in features) + ';\n')

categories = [
    ('museo', t3('Museo', 'Museum', 'Museu'), 'museum'),
    ('teatro', t3('Teatro', 'Theater', 'Teatro'), 'theater'),
    ('iglesia', t3('Iglesia', 'Church', 'Igreja'), 'church'),
    ('parque', t3('Parque', 'Park', 'Parque'), 'park'),
    ('plaza', t3('Plaza', 'Square', 'Praça'), 'square'),
    ('monumento', t3('Monumento', 'Monument', 'Monumento'), 'monument'),
    ('malecon', t3('Malecón', 'Riverfront', 'Calçadão'), 'waves'),
    ('estadio', t3('Estadio', 'Stadium', 'Estádio'), 'stadium'),
    ('patrimonio', t3('Patrimonio', 'Heritage', 'Patrimônio'), 'landmark'),
    ('centro_cultural', t3('Centro cultural', 'Cultural center', 'Centro cultural'), 'palette'),
    ('naturaleza', t3('Naturaleza', 'Nature', 'Natureza'), 'tree'),
    ('comida_tipica', t3('Comida típica', 'Local food', 'Comida típica'), 'utensils'),
    ('bebidas', t3('Bebidas', 'Drinks', 'Bebidas'), 'cup'),
    ('fan_zone', t3('Fan zone', 'Fan zone', 'Fan zone'), 'flag'),
]
w('insert into public.place_categories (slug, name_i18n, icon) values\n  ' + ',\n  '.join(
    f'({q(s)}, {j(n)}, {q(i)})' for s, n, i in categories) + ';\n')

# ------------------------------------------------------------------ zonas reales (OSM simplificado)
def geom(slug):
    return f"extensions.st_multi(extensions.st_setsrid(extensions.st_geomfromgeojson({q(json.dumps(ZONES[slug], separators=(',', ':')))}), 4326))"


w(f"""insert into public.zones (name, slug, zone_type, is_tourist, price_tier, geom) values
  ('Barranquilla', 'barranquilla', 'distrito', false, 2, {geom('barranquilla')});
""")
localidades = [
    ('Riomar', 'loc-riomar', 3), ('Norte - Centro Histórico', 'loc-norte-centro-historico', 2),
    ('Suroccidente', 'loc-suroccidente', 1), ('Suroriente', 'loc-suroriente', 1), ('Metropolitana', 'loc-metropolitana', 1),
]
w('insert into public.zones (name, slug, zone_type, is_tourist, price_tier, parent_id, geom) values\n  ' + ',\n  '.join(
    f"({q('Localidad ' + n)}, {q(s)}, 'localidad', false, {t}, (select id from public.zones where slug = 'barranquilla'), {geom(s)})"
    for n, s, t in localidades) + ';\n')
w(f"""insert into public.zones (name, slug, zone_type, is_tourist, price_tier, parent_id, geom) values
  ('Gran Malecón', 'gran-malecon', 'sector_turistico', true, 3,
   (select id from public.zones where slug = 'loc-norte-centro-historico'), {geom('gran-malecon')});
""")

# Barrios: Voronoi de los centros (Nominatim) recortado a 900 m y al distrito
barrios = [
    # nombre, slug, turístico, nivel de precio, lat, lng
    ('Barrio Abajo', 'barrio-abajo', True, 2, 10.9909327, -74.7843801),
    ('Barlovento', 'barlovento', True, 2, 10.987815, -74.776462),
    ('Centro', 'centro', True, 2, 10.9796421, -74.7787153),
    ('El Prado', 'el-prado', True, 3, 10.9977995, -74.7968685),
    ('Alto Prado', 'alto-prado', False, 3, 11.0043587, -74.8121834),
    ('Bellavista', 'bellavista', False, 3, 11.0014435, -74.7950231),
    ('Villa Country', 'villa-country', False, 3, 11.0058878, -74.8051726),
    ('Boston', 'boston', False, 2, 10.9896688, -74.7954952),
    ('Las Delicias', 'las-delicias', False, 2, 10.9882365, -74.8076832),
    ('Montecristo', 'montecristo', False, 2, 10.995040, -74.786719),
    ('Modelo', 'modelo', False, 2, 10.998621, -74.787620),
    ('La Concepción', 'la-concepcion', False, 2, 11.008142, -74.797212),
    ('Recreo', 'recreo', False, 2, 10.984971, -74.798454),
    ('Ciudad Jardín', 'ciudad-jardin', False, 3, 10.991687, -74.819383),
    ('Villa Santos', 'villa-santos', False, 4, 11.010927, -74.833421),
    ('Riomar', 'riomar', False, 4, 11.018927, -74.822077),
    ('Siape', 'siape', False, 1, 11.026143, -74.802192),
    ('Las Flores', 'las-flores', False, 2, 11.0415375, -74.8266275),
    ('San Roque', 'san-roque', False, 1, 10.9711485, -74.7802247),
    ('Chiquinquirá', 'chiquinquira', False, 1, 10.975995, -74.786829),
    ('Rebolo', 'rebolo', False, 1, 10.9630745, -74.7746882),
    ('Las Nieves', 'las-nieves', False, 1, 10.952569, -74.779177),
    ('La Victoria', 'la-victoria', False, 1, 10.952874, -74.797680),
    ('Simón Bolívar', 'simon-bolivar', False, 1, 10.944283, -74.777216),
    ('Los Andes', 'los-andes', False, 1, 10.972284, -74.803459),
    ('El Bosque', 'el-bosque', False, 1, 10.952763, -74.816639),
    ('Carrizal', 'carrizal', False, 1, 10.936272, -74.807659),
    ('Ciudadela 20 de Julio', 'ciudadela-20-de-julio', False, 1, 10.9270, -74.8010),
]
w('with pts(name, slug, is_tourist, tier, lat, lng) as (values\n  ' + ',\n  '.join(
    f'({q(n)}, {q(s)}, {str(t).lower()}, {p}, {la}, {lo})' for n, s, t, p, la, lo in barrios) + """),
g as (select *, extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326) as p from pts),
vor as (select (extensions.st_dump(extensions.st_voronoipolygons(extensions.st_collect(p)))).geom as v from g),
d as (select geom from public.zones where slug = 'barranquilla')
insert into public.zones (name, slug, zone_type, is_tourist, price_tier, parent_id, geom)
select g.name, g.slug, 'barrio', g.is_tourist, g.tier,
       (select l.id from public.zones l where l.zone_type = 'localidad' and extensions.st_contains(l.geom, g.p) limit 1),
       extensions.st_multi(extensions.st_collectionextract(extensions.st_intersection(
         extensions.st_intersection(vor.v, extensions.st_buffer(g.p::extensions.geography, 900)::extensions.geometry), d.geom), 3))
  from g join vor on extensions.st_contains(vor.v, g.p), d
 where not extensions.st_isempty(extensions.st_intersection(vor.v, d.geom));
""")

# ------------------------------------------------------------------ lugares reales
# (kind, categoría, nombre, descripción es/en/pt, dirección, lat, lng, horario (None = siempre abierto),
#  nivel de precio, etiquetas, al aire libre, popularidad, accesibilidad {feature: nivel})
ACC_FULL = {'silla_ruedas': 'total', 'movilidad_reducida': 'total', 'baja_vision': 'parcial', 'auditiva': 'parcial', 'cognitiva': 'parcial'}
ACC_PART = {'silla_ruedas': 'parcial', 'movilidad_reducida': 'parcial', 'baja_vision': 'parcial', 'auditiva': 'parcial', 'cognitiva': 'parcial'}
ACC_LOW = {'silla_ruedas': 'no', 'movilidad_reducida': 'parcial', 'baja_vision': 'parcial', 'auditiva': 'parcial', 'cognitiva': 'parcial'}

places = [
    ('cultural', 'museo', 'Museo del Caribe',
     t3('Museo interactivo sobre la naturaleza, la gente y la cultura de la región Caribe colombiana, en el Parque Cultural del Caribe.',
        'Interactive museum about the nature, people and culture of the Colombian Caribbean, in the Caribbean Cultural Park.',
        'Museu interativo sobre a natureza, as pessoas e a cultura do Caribe colombiano, no Parque Cultural do Caribe.'),
     'Calle 36 #46-66, Barlovento', 10.986313, -74.778414, None, 2, ['cultura', 'historia', 'familia'], False, 0.95, ACC_FULL),
    ('atractivo', 'malecon', 'Gran Malecón del Río',
     t3('Paseo de cinco kilómetros a orillas del río Magdalena con miradores, zonas verdes, gastronomía y espacios para la familia.',
        'Five-kilometre promenade along the Magdalena River with viewpoints, green areas, food and family spaces.',
        'Calçadão de cinco quilômetros às margens do rio Magdalena, com mirantes, áreas verdes, gastronomia e espaços para a família.'),
     'Vía 40, Gran Malecón', 11.006265, -74.778452, None, 3, ['naturaleza', 'gastronomia', 'familia'], True, 1.0, ACC_FULL),
    ('cultural', 'museo', 'Museo de Arte Moderno de Barranquilla',
     t3('Museo de arte moderno y contemporáneo del Caribe colombiano, junto al Parque Cultural del Caribe.',
        'Modern and contemporary art museum of the Colombian Caribbean, next to the Caribbean Cultural Park.',
        'Museu de arte moderna e contemporânea do Caribe colombiano, ao lado do Parque Cultural do Caribe.'),
     'Calle 36 #46-66, Barlovento', 10.986975, -74.778046, hours('09:00', '18:00', DAYS[1:6]), 2, ['arte', 'cultura'], False, 0.7, ACC_FULL),
    ('cultural', 'patrimonio', 'Edificio de la Antigua Aduana',
     t3('Edificio patrimonial de 1921 que hoy alberga el Archivo Histórico del Atlántico y la Biblioteca Piloto del Caribe.',
        'Heritage building from 1921 that now houses the Atlántico Historical Archive and the Caribbean Pilot Library.',
        'Edifício patrimonial de 1921 que hoje abriga o Arquivo Histórico do Atlântico e a Biblioteca Piloto do Caribe.'),
     'Vía 40 #36-135, Barlovento', 10.988413, -74.778876, hours('08:00', '17:00', DAYS[:5]), 1, ['historia', 'arquitectura', 'cultura'], False, 0.6, ACC_PART),
    ('cultural', 'centro_cultural', 'Fábrica de Cultura',
     t3('Escuela y centro cultural dedicado a las artes del Carnaval, la música y la danza del Caribe.',
        'School and cultural center devoted to Carnival arts, music and Caribbean dance.',
        'Escola e centro cultural dedicado às artes do Carnaval, à música e à dança do Caribe.'),
     'Calle 40 #46-223, Barlovento', 10.988590, -74.780847, hours('08:00', '20:00', DAYS[:6]), 1, ['cultura', 'musica', 'arte'], False, 0.65, ACC_FULL),
    ('atractivo', 'plaza', 'Paseo Bolívar',
     t3('Gran bulevar del centro histórico con la estatua ecuestre de Simón Bolívar, comercio y vida de calle.',
        'Grand boulevard in the historic center with the equestrian statue of Simón Bolívar, shops and street life.',
        'Grande bulevar do centro histórico com a estátua equestre de Simón Bolívar, comércio e vida de rua.'),
     'Paseo Bolívar, Centro', 10.983325, -74.777529, None, 1, ['historia', 'compras'], True, 0.75, ACC_PART),
    ('cultural', 'museo', 'Museo del Atlántico',
     t3('Museo sobre la historia del departamento del Atlántico, en una casona del centro de Barranquilla.',
        'Museum about the history of the Atlántico department, in a mansion in downtown Barranquilla.',
        'Museu sobre a história do departamento do Atlántico, em um casarão do centro de Barranquilla.'),
     'Carrera 39 #35-21, Centro', 10.978250, -74.779904, hours('09:00', '17:00', DAYS[1:]), 1, ['historia', 'cultura'], False, 0.45, ACC_LOW),
    ('atractivo', 'plaza', 'Plaza de San Roque',
     t3('Plaza tradicional junto a la iglesia de San Roque, en uno de los barrios más antiguos de la ciudad.',
        'Traditional square next to San Roque church, in one of the oldest neighborhoods of the city.',
        'Praça tradicional ao lado da igreja de San Roque, em um dos bairros mais antigos da cidade.'),
     'Calle 30, San Roque', 10.975992, -74.777815, None, 1, ['historia', 'gastronomia'], True, 0.4, ACC_PART),
    ('cultural', 'iglesia', 'Catedral Metropolitana María Reina',
     t3('Catedral moderna de la ciudad, con el Cristo Libertador de Arenas Betancourt sobre su fachada.',
        "The city's modern cathedral, with Arenas Betancourt's Cristo Libertador on its facade.",
        'Catedral moderna da cidade, com o Cristo Libertador de Arenas Betancourt na fachada.'),
     'Carrera 45 #53-38, Boston', 10.988500, -74.790568, hours('07:00', '19:00'), 1, ['historia', 'arquitectura', 'cultura'], False, 0.7, ACC_FULL),
    ('atractivo', 'plaza', 'Plaza de la Paz',
     t3('Plaza frente a la catedral, escenario de conciertos, ferias y celebraciones del Carnaval.',
        'Square in front of the cathedral, venue for concerts, fairs and Carnival celebrations.',
        'Praça em frente à catedral, palco de shows, feiras e celebrações do Carnaval.'),
     'Carrera 45 con Calle 53', 10.988023, -74.789011, None, 1, ['cultura', 'musica', 'historia'], True, 0.7, ACC_FULL),
    ('cultural', 'teatro', 'Teatro Amira de la Rosa',
     t3('Principal teatro de la ciudad, sede de conciertos, ópera, danza y teatro.',
        'The main theater of the city, home to concerts, opera, dance and drama.',
        'Principal teatro da cidade, sede de concertos, ópera, dança e teatro.'),
     'Carrera 54 #52-258, Villa Country', 10.993451, -74.789648, hours('10:00', '22:00'), 3, ['cultura', 'musica', 'arte'], False, 0.6, ACC_FULL),
    ('cultural', 'teatro', 'Teatro José Consuegra Higgins',
     t3('Teatro universitario con programación de artes escénicas y música.',
        'University theater with performing arts and music programming.',
        'Teatro universitário com programação de artes cênicas e música.'),
     'Calle 58, Modelo', 10.993863, -74.791874, hours('09:00', '21:00', DAYS[:6]), 2, ['cultura', 'musica'], False, 0.35, ACC_PART),
    ('atractivo', 'monumento', 'Monumento a la Bandera',
     t3('Monumento que recuerda la primera izada de la bandera de Barranquilla.',
        "Monument commemorating the first raising of Barranquilla's flag.",
        'Monumento que lembra o primeiro hasteamento da bandeira de Barranquilla.'),
     'Avenida 11 de Noviembre, Montecristo', 10.993047, -74.791196, None, 1, ['historia'], True, 0.3, ACC_PART),
    ('cultural', 'patrimonio', 'Universidad del Atlántico, Sede Bellas Artes',
     t3('Sede de Bellas Artes con exposiciones, conciertos y vida cultural universitaria.',
        'Fine Arts campus with exhibitions, concerts and university cultural life.',
        'Sede de Belas Artes com exposições, concertos e vida cultural universitária.'),
     'Carrera 43 #50-53, El Rosario', 10.983010, -74.789979, hours('08:00', '18:00', DAYS[:5]), 1, ['arte', 'cultura', 'musica'], False, 0.4, ACC_PART),
    ('cultural', 'patrimonio', 'Cementerio Universal',
     t3('Cementerio histórico con mausoleos y esculturas de valor patrimonial.',
        'Historic cemetery with mausoleums and sculptures of heritage value.',
        'Cemitério histórico com mausoléus e esculturas de valor patrimonial.'),
     'Calle 54, Chiquinquirá', 10.979099, -74.789436, hours('08:00', '17:00'), 1, ['historia', 'arquitectura'], True, 0.2, ACC_LOW),
    ('atractivo', 'monumento', 'Ventana de Campeones',
     t3('Monumento que homenajea a los grandes deportistas barranquilleros, en la entrada del Gran Malecón.',
        "Monument honoring Barranquilla's great athletes, at the entrance of the Gran Malecón.",
        'Monumento que homenageia os grandes atletas de Barranquilla, na entrada do Gran Malecón.'),
     'Rotonda Aleta del Tiburón', 10.998290, -74.772777, None, 2, ['futbol', 'deporte', 'historia'], True, 0.55, ACC_FULL),
    ('atractivo', 'parque', 'Zoológico de Barranquilla',
     t3('Zoológico con fauna del Caribe y de otras regiones, con programas de conservación y educación ambiental.',
        'Zoo with Caribbean wildlife and other regions, with conservation and environmental education programs.',
        'Zoológico com fauna do Caribe e de outras regiões, com programas de conservação e educação ambiental.'),
     'Calle 77 #68-40, La Concepción', 11.010978, -74.798000, hours('09:00', '17:00'), 2, ['naturaleza', 'familia'], True, 0.75, ACC_FULL),
    ('atractivo', 'parque', 'Parque Sagrado Corazón',
     t3('Parque de barrio con zonas verdes, juegos infantiles y espacios para caminar.',
        'Neighborhood park with green areas, playgrounds and walking paths.',
        'Parque de bairro com áreas verdes, brinquedos infantis e espaços para caminhar.'),
     'Ciudad Jardín', 10.993595, -74.818112, None, 2, ['familia', 'naturaleza'], True, 0.3, ACC_FULL),
    ('atractivo', 'parque', 'Parque Washington',
     t3('Parque tradicional del norte con árboles centenarios, senderos y actividades culturales.',
        'Traditional northern park with century-old trees, paths and cultural activities.',
        'Parque tradicional do norte com árvores centenárias, trilhas e atividades culturais.'),
     'Calle 79 con Carrera 55', 11.005487, -74.810989, None, 3, ['familia', 'naturaleza'], True, 0.45, ACC_FULL),
    ('atractivo', 'parque', 'Parque Venezuela',
     t3('Parque de barrio renovado con canchas, gimnasio al aire libre y zonas verdes.',
        'Renovated neighborhood park with courts, outdoor gym and green areas.',
        'Parque de bairro renovado com quadras, academia ao ar livre e áreas verdes.'),
     'La Campiña', 11.001456, -74.824172, None, 2, ['familia', 'deporte'], True, 0.25, ACC_PART),
    ('atractivo', 'parque', 'Parque Suri Salcedo',
     t3('Parque recreativo y deportivo con canchas, pista de patinaje y zonas para la familia.',
        'Recreational and sports park with courts, skating rink and family areas.',
        'Parque recreativo e esportivo com quadras, pista de patinação e áreas para a família.'),
     'Calle 72 con Carrera 46', 10.994092, -74.804266, None, 2, ['deporte', 'familia'], True, 0.4, ACC_FULL),
    ('estadio', 'estadio', 'Estadio Metropolitano Roberto Meléndez',
     t3('Casa de la Selección Colombia y del Junior, el escenario mundialista de Barranquilla.',
        'Home of the Colombian national team and Junior, Barranquilla’s World Cup venue.',
        'Casa da Seleção Colombiana e do Junior, o estádio mundialista de Barranquilla.'),
     'Avenida Circunvalar, Ciudadela 20 de Julio', 10.926955, -74.800511, hours('08:00', '22:00'), 2, ['futbol', 'deporte'], True, 0.9, ACC_FULL),
    ('estadio', 'estadio', 'Estadio Romelio Martínez',
     t3('Estadio histórico de la ciudad, escenario de fútbol, atletismo y eventos.',
        'Historic stadium of the city, venue for football, athletics and events.',
        'Estádio histórico da cidade, palco de futebol, atletismo e eventos.'),
     'Calle 72, Olaya', 10.993807, -74.807086, hours('08:00', '20:00'), 1, ['futbol', 'deporte', 'historia'], True, 0.45, ACC_PART),
    ('fan_zone', 'fan_zone', 'Fan Zone Malecón Puerta de Oro',
     t3('Zona de aficionados del Modo Mundial en el sector Puerta de Oro del Malecón: pantallas gigantes, música y comida.',
        'Modo Mundial fan zone at the Puerta de Oro sector of the Malecón: giant screens, music and food.',
        'Fan zone do Modo Mundial no setor Puerta de Oro do Malecón: telões, música e comida.'),
     'Malecón del Río, sector Puerta de Oro', 11.026082, -74.799473, None, 2, ['futbol', 'musica', 'gastronomia'], True, 0.85, ACC_FULL),
    ('atractivo', 'naturaleza', 'Ecoparque Ciénaga de Mallorquín',
     t3('Ecoparque con senderos y muelles sobre la ciénaga, manglares y avistamiento de aves.',
        'Eco-park with trails and piers over the lagoon, mangroves and birdwatching.',
        'Ecoparque com trilhas e píeres sobre a lagoa, manguezais e observação de aves.'),
     'Las Flores', 11.035010, -74.844505, hours('07:00', '17:00'), 1, ['naturaleza', 'familia'], True, 0.6, ACC_PART),
    ('atractivo', 'naturaleza', 'Bocas de Ceniza',
     t3('Desembocadura del río Magdalena en el mar Caribe, a la que se llega en el tradicional trencito.',
        'Mouth of the Magdalena River into the Caribbean Sea, reached by the traditional little train.',
        'Foz do rio Magdalena no mar do Caribe, aonde se chega pelo tradicional trenzinho.'),
     'Las Flores', 11.106490, -74.854733, hours('06:00', '17:00'), 1, ['naturaleza'], True, 0.5, ACC_LOW),
    ('punto_habilitado', 'centro_cultural', 'Punto QuillaPass Parque Cultural del Caribe',
     t3('Punto habilitado del programa para registrar participación en actividades culturales.',
        'Program check-in point to register participation in cultural activities.',
        'Ponto habilitado do programa para registrar participação em atividades culturais.'),
     'Calle 36 con Carrera 46', 10.986383, -74.778009, None, 1, ['cultura'], True, 0.5, ACC_FULL),
]

w('insert into public.places (kind, category_id, name, description_i18n, address, location, opening_hours, price_level, tags, is_outdoor, popularity, status) values\n  ' + ',\n  '.join(
    f"({q(k)}, (select id from public.place_categories where slug = {q(c)}), {q(n)}, {j(d)}, {q(a)}, "
    f"extensions.st_setsrid(extensions.st_makepoint({lng}, {lat}), 4326)::extensions.geography, "
    f"{j(h) if h else 'null'}, {pl}, {arr(tags)}, {str(out_).lower()}, {pop}, 'published')"
    for k, c, n, d, a, lat, lng, h, pl, tags, out_, pop, _acc in places) + ';\n')

w('insert into public.place_accessibility (place_id, feature_id, level, verified_at)\nselect p.id, f.id, v.level, now()\n  from (values\n  ' + ',\n  '.join(
    f'({q(p[2])}, {q(feat)}, {q(level)})' for p in places for feat, level in p[12].items()) +
  ') as v(place, feature, level)\n  join public.places p on p.name = v.place\n  join public.accessibility_features f on f.slug = v.feature;\n')

# ------------------------------------------------------------------ comercios ficticios, sedes y productos
w("""insert into public.merchants (trade_name, legal_name, nit, status) values
  ('Kiosco Brisa del Río', 'Comercio de demostración 1 (ficticio)', '900000001-1', 'verified'),
  ('Arepas La Cuarenta', 'Comercio de demostración 2 (ficticio)', '900000002-2', 'verified');

-- El kiosco queda dentro del polígono del Gran Malecón (sector turístico); las arepas en Barrio Abajo
insert into public.places (kind, category_id, merchant_id, name, description_i18n, address, location, opening_hours, price_level, tags, is_outdoor, popularity, status)
select 'comercio', (select id from public.place_categories where slug = 'bebidas'), m.id, 'Kiosco Brisa del Río',
       '{"es":"Kiosco de bebidas y fritos en el Gran Malecón (comercio de demostración).","en":"Drinks and fried snacks kiosk at the Gran Malecón (demo merchant).","pt":"Quiosque de bebidas e fritos no Gran Malecón (comércio de demonstração)."}'::jsonb,
       'Gran Malecón, sector central',
       extensions.st_pointonsurface((select geom from public.zones where slug = 'gran-malecon'))::extensions.geography,
       null, 3, array['gastronomia']::text[], true, 0.6, 'published'
  from public.merchants m where m.trade_name = 'Kiosco Brisa del Río';

insert into public.places (kind, category_id, merchant_id, name, description_i18n, address, location, opening_hours, price_level, tags, is_outdoor, popularity, status)
select 'comercio', (select id from public.place_categories where slug = 'comida_tipica'), m.id, 'Arepas La Cuarenta',
       '{"es":"Arepas de huevo, carimañolas y jugos naturales en Barrio Abajo (comercio de demostración).","en":"Egg arepas, carimañolas and fresh juices in Barrio Abajo (demo merchant).","pt":"Arepas de ovo, carimañolas e sucos naturais no Barrio Abajo (comércio de demonstração)."}'::jsonb,
       'Carrera 50 con Calle 40, Barrio Abajo',
       extensions.st_setsrid(extensions.st_makepoint(-74.78440, 10.99060), 4326)::extensions.geography,
       '{"mon":[["06:00","22:00"]],"tue":[["06:00","22:00"]],"wed":[["06:00","22:00"]],"thu":[["06:00","22:00"]],"fri":[["06:00","23:59"]],"sat":[["06:00","23:59"]],"sun":[["07:00","21:00"]]}'::jsonb,
       1, array['gastronomia']::text[], false, 0.5, 'published'
  from public.merchants m where m.trade_name = 'Arepas La Cuarenta';

insert into public.place_accessibility (place_id, feature_id, level, verified_at)
select p.id, f.id, case when p.name = 'Kiosco Brisa del Río' then 'total' else 'parcial' end, now()
  from public.places p cross join public.accessibility_features f where p.kind = 'comercio';
""")

# ------------------------------------------------------------------ Precio Justo: ítems, observaciones y referencias
items = [
    ('agua_600ml', t3('Agua embotellada 600 ml', 'Bottled water 600 ml', 'Água engarrafada 600 ml'), 'botella 600 ml', 'bebidas'),
    ('cerveza_nacional_330ml', t3('Cerveza nacional 330 ml', 'Local beer 330 ml', 'Cerveja nacional 330 ml'), 'botella o lata 330 ml', 'bebidas'),
    ('jugo_natural_12oz', t3('Jugo natural 12 oz', 'Fresh juice 12 oz', 'Suco natural 12 oz'), 'vaso 12 oz', 'bebidas'),
    ('arepa_huevo', t3('Arepa de huevo', 'Egg arepa', 'Arepa de ovo'), 'unidad', 'comida'),
    ('carimanola', t3('Carimañola', 'Carimañola', 'Carimañola'), 'unidad', 'comida'),
    ('butifarra_3und', t3('Butifarra (3 unidades)', 'Butifarra sausage (3 pieces)', 'Butifarra (3 unidades)'), 'porción de 3 unidades', 'comida'),
    ('raspao', t3('Raspao (granizado)', 'Raspao (shaved ice)', 'Raspao (raspadinha)'), 'vaso', 'bebidas'),
]
w('insert into public.price_reference_items (slug, name_i18n, unit, category, created_by) values\n  ' + ',\n  '.join(
    f"({q(s)}, {j(n)}, {q(u)}, {q(c)}, 'seed')" for s, n, u, c in items) + ';\n')

# Observaciones de "encuesta de campo" (precios COP) por zona
obs = {
    'agua_600ml': {'gran-malecon': [3500, 4000], 'barrio-abajo': [2000, 2200, 2500, 2000, 2800, 2300, 2200, 2500, 2400],
                   'centro': [1800, 2000, 2200, 2000, 1900], 'el-prado': [2500, 3000, 2800], 'rebolo': [1500, 1800, 1700]},
    'cerveza_nacional_330ml': {'gran-malecon': [5000, 6000, 6500, 7000, 5500], 'barrio-abajo': [3500, 4000, 3800, 4200],
                               'centro': [3000, 3500, 3500]},
    'jugo_natural_12oz': {'gran-malecon': [6000, 7000, 6500], 'barrio-abajo': [3500, 4000, 4500, 4000], 'centro': [3000, 3500]},
    'arepa_huevo': {'barrio-abajo': [3500, 4000, 4500, 4000, 3800, 4200, 3500, 4000], 'centro': [3000, 3500, 3500],
                    'gran-malecon': [5000, 5500]},
    'carimanola': {'barrio-abajo': [2500, 2500, 3000, 2000, 2800], 'centro': [2000, 2200, 2500]},
    'butifarra_3und': {'gran-malecon': [4000, 4500, 3500], 'barrio-abajo': [3000, 3500, 3000]},
    'raspao': {'gran-malecon': [3000, 3500], 'centro': [1500, 2000, 2000]},
}
rows = []
for slug, zones in obs.items():
    for zslug, prices in zones.items():
        for i, p in enumerate(prices):
            src = 'compra_app' if (slug == 'agua_600ml' and zslug == 'gran-malecon' and i == 1) else 'encuesta_campo'
            weight = 0.8 if src == 'compra_app' else 1.0
            rows.append(f"({q(slug)}, {q(zslug)}, {p}, {q(src)}, {weight}, {3 + (i * 2) % 20})")
w('insert into public.price_observations (reference_item_id, zone_id, price_cop, source, weight, observed_at)\n'
  'select i.id, z.id, v.price, v.source, v.weight, now() - make_interval(days => v.days_ago)\n  from (values\n  ' +
  ',\n  '.join(rows) + ') as v(item, zone, price, source, weight, days_ago)\n'
  '  join public.price_reference_items i on i.slug = v.item\n  join public.zones z on z.slug = v.zone;\n')

refs = [
    # ítem, zona, bajo, mediana, alto, confianza, muestra, razón es/en/pt
    ('agua_600ml', 'gran-malecon', 2500, 3500, 4500, 0.30, 2,
     t3('En el Gran Malecón un agua de 600 ml suele costar entre $2.500 y $4.500; es más que en barrios cercanos por ser zona turística.',
        'At the Gran Malecón a 600 ml water usually costs between $2,500 and $4,500; more than nearby neighborhoods because it is a tourist area.',
        'No Gran Malecón uma água de 600 ml costuma custar entre $2.500 e $4.500; mais que nos bairros próximos por ser zona turística.')),
    ('cerveza_nacional_330ml', 'gran-malecon', 4500, 6000, 7500, 0.55, 5,
     t3('Una cerveza nacional en el Gran Malecón suele costar entre $4.500 y $7.500.', 'A local beer at the Gran Malecón usually costs $4,500 to $7,500.',
        'Uma cerveja nacional no Gran Malecón costuma custar entre $4.500 e $7.500.')),
    ('jugo_natural_12oz', 'gran-malecon', 5000, 6500, 8000, 0.40, 3,
     t3('Un jugo natural de 12 oz en el Gran Malecón suele costar entre $5.000 y $8.000.', 'A 12 oz fresh juice at the Gran Malecón usually costs $5,000 to $8,000.',
        'Um suco natural de 12 oz no Gran Malecón costuma custar entre $5.000 e $8.000.')),
    ('butifarra_3und', 'gran-malecon', 3000, 4000, 5000, 0.40, 3,
     t3('Tres butifarras en el Gran Malecón suelen costar entre $3.000 y $5.000.', 'Three butifarras at the Gran Malecón usually cost $3,000 to $5,000.',
        'Três butifarras no Gran Malecón costumam custar entre $3.000 e $5.000.')),
    ('arepa_huevo', 'barrio-abajo', 3000, 4000, 5000, 0.85, 8,
     t3('En Barrio Abajo una arepa de huevo suele costar entre $3.000 y $5.000.', 'In Barrio Abajo an egg arepa usually costs $3,000 to $5,000.',
        'No Barrio Abajo uma arepa de ovo costuma custar entre $3.000 e $5.000.')),
    ('carimanola', 'barrio-abajo', 2000, 2500, 3000, 0.55, 5,
     t3('En Barrio Abajo una carimañola suele costar entre $2.000 y $3.000.', 'In Barrio Abajo a carimañola usually costs $2,000 to $3,000.',
        'No Barrio Abajo uma carimañola costuma custar entre $2.000 e $3.000.')),
    ('agua_600ml', 'barrio-abajo', 1800, 2200, 2800, 0.85, 9,
     t3('En Barrio Abajo un agua de 600 ml suele costar entre $1.800 y $2.800.', 'In Barrio Abajo a 600 ml water usually costs $1,800 to $2,800.',
        'No Barrio Abajo uma água de 600 ml costuma custar entre $1.800 e $2.800.')),
]
w('insert into public.price_references (reference_item_id, zone_id, low_cop, median_cop, high_cop, method, sample_size, confidence, rationale_i18n, valid_until)\n'
  'select i.id, z.id, v.low, v.median, v.high, \'manual\', v.n, v.conf, v.rationale, now() + interval \'30 days\'\n  from (values\n  ' +
  ',\n  '.join(f'({q(s)}, {q(zs)}, {lo}, {me}, {hi}, {c}, {n}, {j(r)})' for s, zs, lo, me, hi, c, n, r in refs) +
  ') as v(item, zone, low, median, high, conf, n, rationale)\n'
  '  join public.price_reference_items i on i.slug = v.item\n  join public.zones z on z.slug = v.zone;\n')

# Productos (al insertarlos se encolan los jobs de estimación; con referencia vigente solo hacen scraping)
products = [
    ('Kiosco Brisa del Río', 'agua_600ml', 'Agua 600 ml', 'botella 600 ml', 6000, t3('Agua embotellada fría.', 'Cold bottled water.', 'Água engarrafada gelada.')),
    ('Kiosco Brisa del Río', 'cerveza_nacional_330ml', 'Cerveza nacional', 'botella 330 ml', 7000, t3('Cerveza nacional bien fría.', 'Ice-cold local beer.', 'Cerveja nacional bem gelada.')),
    ('Kiosco Brisa del Río', 'jugo_natural_12oz', 'Jugo natural de mango', 'vaso 12 oz', 8000, t3('Jugo natural de mango.', 'Fresh mango juice.', 'Suco natural de manga.')),
    ('Kiosco Brisa del Río', 'butifarra_3und', 'Butifarras (3)', '3 unidades', 5000, t3('Butifarras soledeñas con limón.', 'Soledad-style butifarras with lime.', 'Butifarras de Soledad com limão.')),
    ('Arepas La Cuarenta', 'arepa_huevo', 'Arepa de huevo', 'unidad', 4000, t3('Arepa de huevo con carne molida.', 'Egg arepa with ground beef.', 'Arepa de ovo com carne moída.')),
    ('Arepas La Cuarenta', 'carimanola', 'Carimañola', 'unidad', 3000, t3('Carimañola de queso.', 'Cheese carimañola.', 'Carimañola de queijo.')),
    ('Arepas La Cuarenta', 'agua_600ml', 'Agua 600 ml', 'botella 600 ml', 2500, t3('Agua embotellada.', 'Bottled water.', 'Água engarrafada.')),
    # Sin ítem de referencia: la IA lo normaliza, hace scraping y estima (demo de Precio Justo automático)
    ('Arepas La Cuarenta', None, 'Jugo de corozo', 'vaso 12 oz', 4000, t3('Jugo natural de corozo, fruta típica del Caribe.', 'Fresh corozo juice, a typical Caribbean fruit.', 'Suco natural de corozo, fruta típica do Caribe.')),
]
w('insert into public.products (merchant_id, place_id, reference_item_id, name, unit, price_cop, description_i18n)\n'
  'select m.id, p.id, i.id, v.name, v.unit, v.price, v.descr\n  from (values\n  ' +
  ',\n  '.join(f'({q(mn)}, {q(it)}, {q(n)}, {q(u)}, {pr}, {j(d)})' for mn, it, n, u, pr, d in products) +
  ') as v(merchant, item, name, unit, price, descr)\n'
  '  join public.merchants m on m.trade_name = v.merchant\n'
  '  join public.places p on p.merchant_id = m.id\n'
  '  left join public.price_reference_items i on i.slug = v.item;\n')

# ------------------------------------------------------------------ eventos (relativos al día del seed, hora de Bogotá)
def bog(offset):
    return f"(date_trunc('day', now() at time zone 'America/Bogota') + interval '{offset}') at time zone 'America/Bogota'"


events = [
    ('Fan Zone Malecón Puerta de Oro', t3('Fan Fest Modo Mundial', 'Modo Mundial Fan Fest', 'Fan Fest Modo Mundial'),
     t3('Pantallas gigantes, música en vivo y comida típica para vivir el Mundial en el Malecón.', 'Giant screens, live music and local food to enjoy the World Cup at the Malecón.', 'Telões, música ao vivo e comida típica para viver a Copa no Malecón.'),
     bog('9 hours'), bog('4 days 23 hours'), True, None, 5000),
    ('Estadio Metropolitano Roberto Meléndez', t3('Partido de la Selección en pantalla gigante', 'National team match on the giant screen', 'Jogo da Seleção no telão'),
     t3('Transmisión del partido de la Selección Colombia con actividades para toda la familia.', 'Broadcast of the Colombian national team match with family activities.', 'Transmissão do jogo da Seleção Colombiana com atividades para toda a família.'),
     bog('1 day 18 hours'), bog('1 day 22 hours'), True, 25000, 20000),
    ('Fábrica de Cultura', t3('Noche de tambó en la Fábrica de Cultura', 'Tambó night at Fábrica de Cultura', 'Noite de tambó na Fábrica de Cultura'),
     t3('Rueda de tambó con músicos y bailadores de la escuela de Carnaval.', 'Drum circle with musicians and dancers from the Carnival school.', 'Roda de tambó com músicos e dançarinos da escola de Carnaval.'),
     bog('1 day 19 hours'), bog('1 day 23 hours'), False, None, 200),
    ('Museo del Caribe', t3('Visita guiada nocturna al Museo del Caribe', 'Night guided tour of Museo del Caribe', 'Visita guiada noturna ao Museo del Caribe'),
     t3('Recorrido guiado por las salas del museo con intérprete de lengua de señas.', 'Guided tour of the museum halls with a sign language interpreter.', 'Visita guiada pelas salas do museu com intérprete de língua de sinais.'),
     bog('2 days 18 hours'), bog('2 days 21 hours'), False, None, 60),
    ('Teatro Amira de la Rosa', t3('Concierto de la Orquesta Sinfónica del Caribe', 'Caribbean Symphony Orchestra concert', 'Concerto da Orquestra Sinfônica do Caribe'),
     t3('Repertorio de música del Caribe y clásicos del Mundial en versión sinfónica.', 'Caribbean music and World Cup classics in symphonic version.', 'Música do Caribe e clássicos da Copa em versão sinfônica.'),
     bog('3 days 20 hours'), bog('3 days 22 hours'), True, 30000, 900),
    ('Gran Malecón del Río', t3('Feria gastronómica del Gran Malecón', 'Gran Malecón food fair', 'Feira gastronômica do Gran Malecón'),
     t3('Cocineras tradicionales del Atlántico con platos típicos a precio justo.', 'Traditional Atlántico cooks with typical dishes at fair prices.', 'Cozinheiras tradicionais do Atlántico com pratos típicos a preço justo.'),
     bog('2 days 12 hours'), bog('2 days 22 hours'), False, None, None),
]
w('insert into public.events (place_id, title_i18n, description_i18n, starts_at, ends_at, is_mundial, price_cop, capacity) values\n  ' + ',\n  '.join(
    f"((select id from public.places where name = {q(p)}), {j(t)}, {j(d)}, {s}, {e}, {str(m).lower()}, {'null' if pr is None else pr}, {'null' if cap is None else cap})"
    for p, t, d, s, e, m, pr, cap in events) + ';\n')

# ------------------------------------------------------------------ créditos: reglas de inclusión y actividades
w("""insert into public.inclusion_bonus_rules (name, criteria, bonus_type, value, priority) values
  ('Bonificación de inclusión por accesibilidad', '{"accessibility_needs": "any"}', 'percent', 20, 100),
  ('Bonificación para personas mayores', '{"age_gte": 60}', 'percent', 20, 90),
  ('Bonificación por descubrir tu ciudad', '{"user_type": "residente", "zone_is_tourist": false}', 'percent', 25, 80);
""")
activities = [
    ('Museo del Caribe', None, t3('Visita guiada al Museo del Caribe', 'Guided visit to Museo del Caribe', 'Visita guiada ao Museo del Caribe'),
     t3('Recorre las salas del museo y registra tu participación en el punto habilitado.', 'Tour the museum halls and check in at the enabled point.', 'Percorra as salas do museu e registre sua participação no ponto habilitado.'),
     'visita', 100, 'total', 1, None, 150),
    ('Gran Malecón del Río', None, t3('Recorrido por el Gran Malecón', 'Gran Malecón walk', 'Passeio pelo Gran Malecón'),
     t3('Camina el Gran Malecón y conoce sus miradores. Puedes registrarlo una vez al día.', 'Walk the Gran Malecón and its viewpoints. You can check in once a day.', 'Caminhe pelo Gran Malecón e conheça seus mirantes. Registro uma vez por dia.'),
     'ruta', 50, 'day', 1, None, 300),
    ('Fábrica de Cultura', None, t3('Taller de tambora en la Fábrica de Cultura', 'Tambora drum workshop at Fábrica de Cultura', 'Oficina de tambora na Fábrica de Cultura'),
     t3('Aprende los ritmos del Carnaval con maestros de la escuela.', 'Learn Carnival rhythms with the school masters.', 'Aprenda os ritmos do Carnaval com os mestres da escola.'),
     'evento', 150, 'total', 1, 40, 150),
    ('Ecoparque Ciénaga de Mallorquín', None, t3('Jornada de limpieza en la Ciénaga de Mallorquín', 'Clean-up day at Ciénaga de Mallorquín', 'Mutirão de limpeza na Ciénaga de Mallorquín'),
     t3('Voluntariado ambiental para cuidar el manglar y la ciénaga.', 'Environmental volunteering to care for the mangrove and lagoon.', 'Voluntariado ambiental para cuidar do manguezal e da lagoa.'),
     'voluntariado', 300, 'total', 1, 50, 200),
    ('Fan Zone Malecón Puerta de Oro', 'Fan Fest Modo Mundial', t3('Vive el Fan Fest Modo Mundial', 'Join the Modo Mundial Fan Fest', 'Viva o Fan Fest Modo Mundial'),
     t3('Registra tu visita al Fan Fest y gana créditos cada día del evento.', 'Check in at the Fan Fest and earn credits every day of the event.', 'Registre sua visita ao Fan Fest e ganhe créditos todos os dias do evento.'),
     'evento', 80, 'day', 1, None, 300),
    ('Ventana de Campeones', None, t3('Visita la Ventana de Campeones', 'Visit the Ventana de Campeones', 'Visite a Ventana de Campeones'),
     t3('Conoce el homenaje a los campeones barranquilleros.', "Discover the tribute to Barranquilla's champions.", 'Conheça a homenagem aos campeões de Barranquilla.'),
     'visita', 50, 'total', 1, None, 150),
]
w('insert into public.activities (place_id, event_id, title_i18n, description_i18n, activity_type, base_credits, valid_from, valid_to, per_user_period, max_per_user, global_cap, checkin_radius_m, checkin_method, status) values\n  ' + ',\n  '.join(
    f"((select id from public.places where name = {q(p)}), "
    f"{'null' if ev is None else '(select id from public.events where title_i18n ->> ' + q('es') + ' = ' + q(ev) + ')'}, "
    f"{j(t)}, {j(d)}, {q(ty)}, {cr}, now() - interval '1 day', now() + interval '45 days', {q(per)}, {mx}, {'null' if cap is None else cap}, {rad}, 'geo', 'published')"
    for p, ev, t, d, ty, cr, per, mx, cap, rad in activities) + ';\n')

# ------------------------------------------------------------------ bonos
w("""insert into public.benefits (merchant_id, place_id, title_i18n, terms_i18n, discount_type, discount_value, max_discount_cop, applies_to, cost_credits, stock_total, stock_left, per_user_limit, redeem_until, use_days, funded_by, status)
select m.id, p.id, v.title, v.terms, v.dtype, v.dval, v.maxd, v.applies, v.cost, v.stock, v.stock, v.per_user, now() + interval '60 days', v.use_days, v.funded, 'published'
  from (values
  ('Kiosco Brisa del Río', '{"es":"Bono de $10.000 en el Gran Malecón","en":"$10,000 voucher at the Gran Malecón","pt":"Vale de $10.000 no Gran Malecón"}'::jsonb,
   '{"es":"Válido en Kiosco Brisa del Río. Un bono por compra. Lo asume el programa Barranquilla Anfitriona.","en":"Valid at Kiosco Brisa del Río. One voucher per purchase. Funded by the Barranquilla Anfitriona program.","pt":"Válido no Kiosco Brisa del Río. Um vale por compra. Financiado pelo programa Barranquilla Anfitriona."}'::jsonb,
   'fixed_cop', 10000, null::bigint, '{}'::jsonb, 300, 100, 1, 30, 'program'),
  ('Arepas La Cuarenta', '{"es":"20 % en Arepas La Cuarenta","en":"20% off at Arepas La Cuarenta","pt":"20 % no Arepas La Cuarenta"}'::jsonb,
   '{"es":"Descuento del 20 % hasta $5.000 en toda la compra. Lo asume el comercio.","en":"20% off up to $5,000 on the whole purchase. Funded by the merchant.","pt":"Desconto de 20 % até $5.000 em toda a compra. Financiado pelo comércio."}'::jsonb,
   'percent', 20, 5000::bigint, '{}'::jsonb, 150, 200, 2, 15, 'merchant'),
  ('Kiosco Brisa del Río', '{"es":"15 % en jugos naturales del Malecón","en":"15% off fresh juices at the Malecón","pt":"15 % em sucos naturais do Malecón"}'::jsonb,
   '{"es":"Aplica solo a jugos naturales del Kiosco Brisa del Río.","en":"Applies only to fresh juices at Kiosco Brisa del Río.","pt":"Vale apenas para sucos naturais do Kiosco Brisa del Río."}'::jsonb,
   'percent', 15, null::bigint, '{}'::jsonb, 100, null::int, 3, 15, 'merchant')
  ) as v(merchant, title, terms, dtype, dval, maxd, applies, cost, stock, per_user, use_days, funded)
  join public.merchants m on m.trade_name = v.merchant
  join public.places p on p.merchant_id = m.id;

-- El bono de jugos aplica solo a ese producto
update public.benefits b set applies_to = jsonb_build_object('product_ids', jsonb_build_array(pr.id))
  from public.products pr
 where b.title_i18n ->> 'es' = '15 % en jugos naturales del Malecón' and pr.name = 'Jugo natural de mango';
""")

# ------------------------------------------------------------------ alerta de mapa (P2, sembrada a mano)
w("""insert into public.map_alerts (type, severity, title_i18n, message_i18n, geom, starts_at, ends_at, source) values
  ('arroyo', 'precaucion',
   '{"es":"Precaución: arroyo de Rebolo","en":"Caution: Rebolo stream","pt":"Atenção: córrego de Rebolo"}',
   '{"es":"Con lluvia, evita cruzar el arroyo de Rebolo. Usa rutas alternas.","en":"When it rains, avoid crossing the Rebolo stream. Use alternative routes.","pt":"Com chuva, evite atravessar o córrego de Rebolo. Use rotas alternativas."}',
   extensions.st_buffer(extensions.st_setsrid(extensions.st_makeline(extensions.st_makepoint(-74.7880, 10.9600), extensions.st_makepoint(-74.7760, 10.9640)), 4326)::extensions.geography, 120)::extensions.geometry,
   now(), now() + interval '7 days', 'operador');
""")

# ------------------------------------------------------------------ usuario de demo
w("""-- Usuario de demo (respaldo de la demo y pruebas): demo@quillapass.test / QuillaPass-Demo-2026
-- Al insertarlo, handle_new_user crea perfil, cuentas y la bienvenida (100.000 COP + 200 CC)
with u as (
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change,
                          email_change_token_current, reauthentication_token, phone_change, phone_change_token)
  values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          'demo@quillapass.test', extensions.crypt('QuillaPass-Demo-2026', extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}', '{"display_name":"Valentina (demo)","language":"es"}', now(), now(),
          '', '', '', '', '', '', '', '')
  returning id, email
)
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
       'email', now(), now(), now()
  from u;

-- Perfil de la demo: visitante, cultura y gastronomía, silla de ruedas
select public.fn_update_preferences(
  (select id from auth.users where email = 'demo@quillapass.test'),
  '{"display_name":"Valentina (demo)","user_type":"visitante","interests":["cultura","gastronomia"],"accessibility_needs":["silla_ruedas"],"onboarded":true}'::jsonb);

-- QR estáticos de cobro de cada sede (V10)
select public.fn_merchant_qr(p.id) from public.places p where p.kind = 'comercio';
""")

w('commit;')
print('\n'.join(out))

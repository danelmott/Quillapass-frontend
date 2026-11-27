-- =====================================================================================
-- Seed de la demo CiviLoop / QuillaPass (D8 + D9). Generado por supabase/scripts/build_seed.py
-- Datos geográficos © colaboradores de OpenStreetMap (ODbL). Comercios y productos: ficticios.
-- =====================================================================================
begin;
do $$ begin
  if exists (select 1 from public.zones) then raise exception 'El seed ya fue aplicado (hay zonas)'; end if;
end $$;

insert into public.interests (slug, name_i18n, icon) values
  ('cultura', '{"es":"Cultura","en":"Culture","pt":"Cultura"}'::jsonb, 'theater'),
  ('historia', '{"es":"Historia","en":"History","pt":"História"}'::jsonb, 'landmark'),
  ('arte', '{"es":"Arte","en":"Art","pt":"Arte"}'::jsonb, 'palette'),
  ('musica', '{"es":"Música","en":"Music","pt":"Música"}'::jsonb, 'music'),
  ('gastronomia', '{"es":"Gastronomía","en":"Food","pt":"Gastronomia"}'::jsonb, 'utensils'),
  ('naturaleza', '{"es":"Naturaleza","en":"Nature","pt":"Natureza"}'::jsonb, 'tree'),
  ('familia', '{"es":"Planes en familia","en":"Family","pt":"Família"}'::jsonb, 'users'),
  ('futbol', '{"es":"Fútbol","en":"Football","pt":"Futebol"}'::jsonb, 'soccer'),
  ('deporte', '{"es":"Deporte","en":"Sports","pt":"Esporte"}'::jsonb, 'running'),
  ('compras', '{"es":"Compras","en":"Shopping","pt":"Compras"}'::jsonb, 'bag'),
  ('arquitectura', '{"es":"Arquitectura","en":"Architecture","pt":"Arquitetura"}'::jsonb, 'building');

insert into public.accessibility_features (slug, name_i18n) values
  ('silla_ruedas', '{"es":"Silla de ruedas","en":"Wheelchair","pt":"Cadeira de rodas"}'::jsonb),
  ('movilidad_reducida', '{"es":"Movilidad reducida","en":"Reduced mobility","pt":"Mobilidade reduzida"}'::jsonb),
  ('baja_vision', '{"es":"Baja visión","en":"Low vision","pt":"Baixa visão"}'::jsonb),
  ('auditiva', '{"es":"Discapacidad auditiva","en":"Hearing impairment","pt":"Deficiência auditiva"}'::jsonb),
  ('cognitiva', '{"es":"Discapacidad cognitiva","en":"Cognitive disability","pt":"Deficiência cognitiva"}'::jsonb);

insert into public.place_categories (slug, name_i18n, icon) values
  ('museo', '{"es":"Museo","en":"Museum","pt":"Museu"}'::jsonb, 'museum'),
  ('teatro', '{"es":"Teatro","en":"Theater","pt":"Teatro"}'::jsonb, 'theater'),
  ('iglesia', '{"es":"Iglesia","en":"Church","pt":"Igreja"}'::jsonb, 'church'),
  ('parque', '{"es":"Parque","en":"Park","pt":"Parque"}'::jsonb, 'park'),
  ('plaza', '{"es":"Plaza","en":"Square","pt":"Praça"}'::jsonb, 'square'),
  ('monumento', '{"es":"Monumento","en":"Monument","pt":"Monumento"}'::jsonb, 'monument'),
  ('malecon', '{"es":"Malecón","en":"Riverfront","pt":"Calçadão"}'::jsonb, 'waves'),
  ('estadio', '{"es":"Estadio","en":"Stadium","pt":"Estádio"}'::jsonb, 'stadium'),
  ('patrimonio', '{"es":"Patrimonio","en":"Heritage","pt":"Patrimônio"}'::jsonb, 'landmark'),
  ('centro_cultural', '{"es":"Centro cultural","en":"Cultural center","pt":"Centro cultural"}'::jsonb, 'palette'),
  ('naturaleza', '{"es":"Naturaleza","en":"Nature","pt":"Natureza"}'::jsonb, 'tree'),
  ('comida_tipica', '{"es":"Comida típica","en":"Local food","pt":"Comida típica"}'::jsonb, 'utensils'),
  ('bebidas', '{"es":"Bebidas","en":"Drinks","pt":"Bebidas"}'::jsonb, 'cup'),
  ('fan_zone', '{"es":"Fan zone","en":"Fan zone","pt":"Fan zone"}'::jsonb, 'flag');

insert into public.zones (name, slug, zone_type, is_tourist, price_tier, geom) values
  ('Barranquilla', 'barranquilla', 'distrito', false, 2, extensions.st_multi(extensions.st_setsrid(extensions.st_geomfromgeojson('{"type":"Polygon","coordinates":[[[-74.91921,10.94684],[-74.91827,10.94548],[-74.90769,10.95057],[-74.89226,10.95048],[-74.89211,10.94591],[-74.87759,10.94506],[-74.86757,10.93888],[-74.85813,10.93667],[-74.85018,10.93882],[-74.84364,10.92885],[-74.83831,10.92627],[-74.83923,10.92137],[-74.83232,10.9157],[-74.82667,10.91389],[-74.81476,10.92233],[-74.79833,10.92132],[-74.79712,10.92342],[-74.79772,10.92641],[-74.79463,10.93055],[-74.78207,10.93758],[-74.78121,10.93482],[-74.7797,10.93507],[-74.77755,10.94065],[-74.77363,10.94414],[-74.76779,10.94529],[-74.76546,10.94362],[-74.7625,10.94538],[-74.76054,10.94412],[-74.75363,10.9442],[-74.7553,10.95153],[-74.75684,10.97607],[-74.76433,10.99938],[-74.76677,11.00329],[-74.79999,11.03071],[-74.82732,11.04756],[-74.83642,11.05683],[-74.842,11.06577],[-74.84569,11.07742],[-74.85165,11.10664],[-74.85492,11.10634],[-74.84704,11.07117],[-74.84931,11.07038],[-74.84878,11.06796],[-74.8465,11.06847],[-74.84431,11.06364],[-74.84693,11.05856],[-74.8529,11.05348],[-74.84984,11.05339],[-74.84307,11.06036],[-74.84067,11.05723],[-74.84222,11.05608],[-74.83732,11.05266],[-74.8355,11.04595],[-74.83371,11.04543],[-74.83283,11.0474],[-74.83029,11.04652],[-74.83001,11.0442],[-74.83216,11.04419],[-74.82987,11.0413],[-74.83213,11.04159],[-74.83414,11.03986],[-74.83442,11.03598],[-74.83751,11.03657],[-74.83992,11.0335],[-74.84308,11.03225],[-74.8476,11.03155],[-74.84867,11.03258],[-74.84512,11.04005],[-74.84598,11.04072],[-74.8472,11.03789],[-74.84905,11.03871],[-74.84899,11.03555],[-74.85034,11.03444],[-74.85344,11.03353],[-74.85748,11.03551],[-74.85809,11.03339],[-74.86025,11.03275],[-74.86191,11.03395],[-74.85781,11.03566],[-74.86481,11.0376],[-74.86772,11.04408],[-74.8531,11.05231],[-74.8615,11.04768],[-74.86254,11.04882],[-74.8696,11.04599],[-74.87165,11.04229],[-74.87058,11.0396],[-74.87353,11.03156],[-74.87135,11.0275],[-74.86822,11.02659],[-74.87162,11.0224],[-74.87005,11.02128],[-74.86651,11.02545],[-74.86486,11.0249],[-74.86046,11.02852],[-74.85934,11.03142],[-74.84957,11.02994],[-74.84,11.03251],[-74.82752,11.03881],[-74.82705,11.03742],[-74.832,11.03131],[-74.83998,11.01325],[-74.84221,11.01269],[-74.85187,11.01705],[-74.86521,11.01683],[-74.87163,11.00902],[-74.87462,11.01099],[-74.88359,11.0019],[-74.87534,10.99549],[-74.87677,10.994],[-74.87654,10.99051],[-74.87394,10.99052],[-74.87512,10.98899],[-74.87385,10.98747],[-74.87588,10.98688],[-74.88251,10.97888],[-74.88551,10.9785],[-74.88625,10.977],[-74.8955,10.98082],[-74.90455,10.97138],[-74.90808,10.97235],[-74.90002,10.96087],[-74.90525,10.9604],[-74.90838,10.95734],[-74.91505,10.95687],[-74.91792,10.95392],[-74.91709,10.95136],[-74.91921,10.94684]]]}'), 4326)));

insert into public.zones (name, slug, zone_type, is_tourist, price_tier, parent_id, geom) values
  ('Localidad Riomar', 'loc-riomar', 'localidad', false, 3, (select id from public.zones where slug = 'barranquilla'), extensions.st_multi(extensions.st_setsrid(extensions.st_geomfromgeojson('{"type":"Polygon","coordinates":[[[-74.84287,11.01291],[-74.82998,11.00609],[-74.83024,11.00532],[-74.82813,11.00405],[-74.81877,11.0024],[-74.81675,11.0066],[-74.81828,11.00732],[-74.81518,11.01019],[-74.81322,11.00934],[-74.81393,11.00877],[-74.81209,11.00796],[-74.80872,11.01575],[-74.81101,11.01635],[-74.81074,11.01731],[-74.80924,11.01931],[-74.80752,11.01898],[-74.80634,11.02065],[-74.80269,11.02301],[-74.80128,11.02512],[-74.80029,11.02826],[-74.8105,11.03425],[-74.81828,11.03942],[-74.82055,11.04159],[-74.82824,11.04532],[-74.83013,11.04417],[-74.83131,11.0448],[-74.83207,11.04394],[-74.82983,11.04178],[-74.82994,11.04121],[-74.83085,11.04135],[-74.83085,11.04072],[-74.82844,11.03831],[-74.82716,11.03887],[-74.82705,11.03742],[-74.83239,11.03057],[-74.83903,11.01443],[-74.84019,11.01315],[-74.84287,11.01291]]]}'), 4326))),
  ('Localidad Norte - Centro Histórico', 'loc-norte-centro-historico', 'localidad', false, 2, (select id from public.zones where slug = 'barranquilla'), extensions.st_multi(extensions.st_setsrid(extensions.st_geomfromgeojson('{"type":"Polygon","coordinates":[[[-74.84221,11.00423],[-74.8367,10.9886],[-74.83613,10.98264],[-74.83238,10.98313],[-74.82913,10.98675],[-74.82818,10.98645],[-74.82718,10.98496],[-74.82604,10.98474],[-74.82305,10.98504],[-74.81908,10.98734],[-74.80477,10.98373],[-74.80542,10.98222],[-74.802,10.98109],[-74.80253,10.9799],[-74.80122,10.97936],[-74.80068,10.98047],[-74.79685,10.97906],[-74.79565,10.97958],[-74.79595,10.97914],[-74.79405,10.97866],[-74.79388,10.9795],[-74.79166,10.97895],[-74.79142,10.97985],[-74.79057,10.97962],[-74.7903,10.98066],[-74.77461,10.97517],[-74.76904,10.9742],[-74.76931,10.97767],[-74.76304,10.97792],[-74.75936,10.97698],[-74.75892,10.97877],[-74.75953,10.98235],[-74.7624,10.99135],[-74.76635,10.99792],[-74.77549,11.00657],[-74.77857,11.00842],[-74.77764,11.00699],[-74.77891,11.00798],[-74.77949,11.00768],[-74.78335,11.01191],[-74.78696,11.01409],[-74.78728,11.01516],[-74.80035,11.02746],[-74.80295,11.02274],[-74.80634,11.02065],[-74.80752,11.01898],[-74.80924,11.01931],[-74.81074,11.01731],[-74.81101,11.01635],[-74.80872,11.01575],[-74.81209,11.00796],[-74.81393,11.00877],[-74.81322,11.00934],[-74.81518,11.01019],[-74.81828,11.00732],[-74.81675,11.0066],[-74.81877,11.0024],[-74.82813,11.00405],[-74.83024,11.00532],[-74.82998,11.00609],[-74.84034,11.01156],[-74.84221,11.00423]]]}'), 4326))),
  ('Localidad Suroccidente', 'loc-suroccidente', 'localidad', false, 1, (select id from public.zones where slug = 'barranquilla'), extensions.st_multi(extensions.st_setsrid(extensions.st_geomfromgeojson('{"type":"Polygon","coordinates":[[[-74.90769,10.95057],[-74.8997,10.94971],[-74.89226,10.95048],[-74.89204,10.94589],[-74.87759,10.94506],[-74.87808,10.94456],[-74.87118,10.9403],[-74.85813,10.93667],[-74.85365,10.93837],[-74.84962,10.93895],[-74.84381,10.94216],[-74.83881,10.94365],[-74.83036,10.94346],[-74.81478,10.94811],[-74.80583,10.95652],[-74.80322,10.96215],[-74.8004,10.96138],[-74.79839,10.96259],[-74.79512,10.96294],[-74.79088,10.96499],[-74.788,10.9673],[-74.7904,10.968],[-74.78901,10.9732],[-74.79223,10.97464],[-74.79057,10.97962],[-74.79142,10.97985],[-74.79166,10.97895],[-74.79388,10.9795],[-74.79405,10.97866],[-74.79595,10.97914],[-74.79565,10.97958],[-74.79685,10.97906],[-74.80068,10.98047],[-74.80122,10.97936],[-74.80253,10.9799],[-74.802,10.98109],[-74.80542,10.98222],[-74.80477,10.98373],[-74.81881,10.98731],[-74.82305,10.98504],[-74.82604,10.98474],[-74.82718,10.98496],[-74.82818,10.98645],[-74.82913,10.98675],[-74.83266,10.98299],[-74.83673,10.98255],[-74.84717,10.97975],[-74.90769,10.95057]]]}'), 4326))),
  ('Localidad Suroriente', 'loc-suroriente', 'localidad', false, 1, (select id from public.zones where slug = 'barranquilla'), extensions.st_multi(extensions.st_setsrid(extensions.st_geomfromgeojson('{"type":"Polygon","coordinates":[[[-74.80305,10.94915],[-74.80208,10.94829],[-74.80048,10.94831],[-74.80052,10.94357],[-74.79727,10.94411],[-74.79745,10.93869],[-74.79664,10.93519],[-74.79914,10.93487],[-74.79919,10.93005],[-74.79754,10.92989],[-74.7974,10.93083],[-74.79654,10.93122],[-74.79443,10.93062],[-74.79235,10.93107],[-74.79069,10.93355],[-74.78828,10.9337],[-74.78207,10.93758],[-74.78121,10.93482],[-74.7797,10.93507],[-74.77755,10.94065],[-74.77664,10.94106],[-74.77625,10.94251],[-74.77363,10.94414],[-74.77082,10.94424],[-74.76841,10.94532],[-74.76669,10.94424],[-74.76597,10.94447],[-74.76546,10.94362],[-74.76392,10.94511],[-74.76275,10.94536],[-74.76069,10.94416],[-74.75961,10.94441],[-74.75882,10.94514],[-74.75849,10.96126],[-74.75936,10.97698],[-74.76304,10.97792],[-74.76931,10.97767],[-74.76904,10.9742],[-74.77461,10.97517],[-74.7903,10.98066],[-74.79223,10.97464],[-74.78901,10.9732],[-74.7904,10.968],[-74.788,10.9673],[-74.79088,10.96499],[-74.795,10.96299],[-74.79891,10.96227],[-74.7964,10.9594],[-74.80237,10.95381],[-74.803,10.95212],[-74.80166,10.95153],[-74.80305,10.94915]]]}'), 4326))),
  ('Localidad Metropolitana', 'loc-metropolitana', 'localidad', false, 1, (select id from public.zones where slug = 'barranquilla'), extensions.st_multi(extensions.st_setsrid(extensions.st_geomfromgeojson('{"type":"Polygon","coordinates":[[[-74.83442,10.93577],[-74.83392,10.93311],[-74.8325,10.93078],[-74.82753,10.92791],[-74.82867,10.92563],[-74.82816,10.92494],[-74.82934,10.9218],[-74.82327,10.92091],[-74.82247,10.92554],[-74.81607,10.92244],[-74.81086,10.92254],[-74.80837,10.92169],[-74.80518,10.92245],[-74.79833,10.92132],[-74.79801,10.923],[-74.79712,10.92342],[-74.79809,10.92446],[-74.79772,10.92641],[-74.79703,10.92652],[-74.79663,10.92824],[-74.79569,10.92864],[-74.79443,10.93062],[-74.79654,10.93122],[-74.7974,10.93083],[-74.79754,10.92989],[-74.79919,10.93005],[-74.79914,10.93487],[-74.79664,10.93519],[-74.79745,10.93869],[-74.79727,10.94411],[-74.80052,10.94357],[-74.80048,10.94831],[-74.80208,10.94829],[-74.80305,10.94915],[-74.80166,10.95153],[-74.803,10.95212],[-74.80237,10.95381],[-74.7964,10.9594],[-74.79891,10.96227],[-74.8004,10.96138],[-74.8029,10.96229],[-74.80583,10.95652],[-74.81395,10.94853],[-74.82553,10.94449],[-74.83371,10.94332],[-74.83442,10.93577]]]}'), 4326)));

insert into public.zones (name, slug, zone_type, is_tourist, price_tier, parent_id, geom) values
  ('Gran Malecón', 'gran-malecon', 'sector_turistico', true, 3,
   (select id from public.zones where slug = 'loc-norte-centro-historico'), extensions.st_multi(extensions.st_setsrid(extensions.st_geomfromgeojson('{"type":"Polygon","coordinates":[[[-74.78533,11.01263],[-74.7839,11.01156],[-74.776,11.00386],[-74.77361,11.00045],[-74.7733,10.99961],[-74.77306,10.99971],[-74.77304,10.99991],[-74.77416,11.00141],[-74.77487,11.0028],[-74.77745,11.00547],[-74.77919,11.00702],[-74.78086,11.00875],[-74.78335,11.01191],[-74.78517,11.01285],[-74.78533,11.01263]]]}'), 4326)));

with pts(name, slug, is_tourist, tier, lat, lng) as (values
  ('Barrio Abajo', 'barrio-abajo', true, 2, 10.9909327, -74.7843801),
  ('Barlovento', 'barlovento', true, 2, 10.987815, -74.776462),
  ('Centro', 'centro', true, 2, 10.9796421, -74.7787153),
  ('El Prado', 'el-prado', true, 3, 10.9977995, -74.7968685),
  ('Alto Prado', 'alto-prado', false, 3, 11.0043587, -74.8121834),
  ('Bellavista', 'bellavista', false, 3, 11.0014435, -74.7950231),
  ('Villa Country', 'villa-country', false, 3, 11.0058878, -74.8051726),
  ('Boston', 'boston', false, 2, 10.9896688, -74.7954952),
  ('Las Delicias', 'las-delicias', false, 2, 10.9882365, -74.8076832),
  ('Montecristo', 'montecristo', false, 2, 10.99504, -74.786719),
  ('Modelo', 'modelo', false, 2, 10.998621, -74.78762),
  ('La Concepción', 'la-concepcion', false, 2, 11.008142, -74.797212),
  ('Recreo', 'recreo', false, 2, 10.984971, -74.798454),
  ('Ciudad Jardín', 'ciudad-jardin', false, 3, 10.991687, -74.819383),
  ('Villa Santos', 'villa-santos', false, 4, 11.010927, -74.833421),
  ('Riomar', 'riomar', false, 4, 11.018927, -74.822077),
  ('Siape', 'siape', false, 1, 11.026143, -74.802192),
  ('Las Flores', 'las-flores', false, 2, 11.0415375, -74.8266275),
  ('San Roque', 'san-roque', false, 1, 10.9711485, -74.7802247),
  ('Chiquinquirá', 'chiquinquira', false, 1, 10.975995, -74.786829),
  ('Rebolo', 'rebolo', false, 1, 10.9630745, -74.7746882),
  ('Las Nieves', 'las-nieves', false, 1, 10.952569, -74.779177),
  ('La Victoria', 'la-victoria', false, 1, 10.952874, -74.79768),
  ('Simón Bolívar', 'simon-bolivar', false, 1, 10.944283, -74.777216),
  ('Los Andes', 'los-andes', false, 1, 10.972284, -74.803459),
  ('El Bosque', 'el-bosque', false, 1, 10.952763, -74.816639),
  ('Carrizal', 'carrizal', false, 1, 10.936272, -74.807659),
  ('Ciudadela 20 de Julio', 'ciudadela-20-de-julio', false, 1, 10.927, -74.801)),
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

insert into public.places (kind, category_id, name, description_i18n, address, location, opening_hours, price_level, tags, is_outdoor, popularity, status) values
  ('cultural', (select id from public.place_categories where slug = 'museo'), 'Museo del Caribe', '{"es":"Museo interactivo sobre la naturaleza, la gente y la cultura de la región Caribe colombiana, en el Parque Cultural del Caribe.","en":"Interactive museum about the nature, people and culture of the Colombian Caribbean, in the Caribbean Cultural Park.","pt":"Museu interativo sobre a natureza, as pessoas e a cultura do Caribe colombiano, no Parque Cultural do Caribe."}'::jsonb, 'Calle 36 #46-66, Barlovento', extensions.st_setsrid(extensions.st_makepoint(-74.778414, 10.986313), 4326)::extensions.geography, null, 2, array['cultura','historia','familia']::text[], false, 0.95, 'published'),
  ('atractivo', (select id from public.place_categories where slug = 'malecon'), 'Gran Malecón del Río', '{"es":"Paseo de cinco kilómetros a orillas del río Magdalena con miradores, zonas verdes, gastronomía y espacios para la familia.","en":"Five-kilometre promenade along the Magdalena River with viewpoints, green areas, food and family spaces.","pt":"Calçadão de cinco quilômetros às margens do rio Magdalena, com mirantes, áreas verdes, gastronomia e espaços para a família."}'::jsonb, 'Vía 40, Gran Malecón', extensions.st_setsrid(extensions.st_makepoint(-74.778452, 11.006265), 4326)::extensions.geography, null, 3, array['naturaleza','gastronomia','familia']::text[], true, 1.0, 'published'),
  ('cultural', (select id from public.place_categories where slug = 'museo'), 'Museo de Arte Moderno de Barranquilla', '{"es":"Museo de arte moderno y contemporáneo del Caribe colombiano, junto al Parque Cultural del Caribe.","en":"Modern and contemporary art museum of the Colombian Caribbean, next to the Caribbean Cultural Park.","pt":"Museu de arte moderna e contemporânea do Caribe colombiano, ao lado do Parque Cultural do Caribe."}'::jsonb, 'Calle 36 #46-66, Barlovento', extensions.st_setsrid(extensions.st_makepoint(-74.778046, 10.986975), 4326)::extensions.geography, '{"tue":[["09:00","18:00"]],"wed":[["09:00","18:00"]],"thu":[["09:00","18:00"]],"fri":[["09:00","18:00"]],"sat":[["09:00","18:00"]]}'::jsonb, 2, array['arte','cultura']::text[], false, 0.7, 'published'),
  ('cultural', (select id from public.place_categories where slug = 'patrimonio'), 'Edificio de la Antigua Aduana', '{"es":"Edificio patrimonial de 1921 que hoy alberga el Archivo Histórico del Atlántico y la Biblioteca Piloto del Caribe.","en":"Heritage building from 1921 that now houses the Atlántico Historical Archive and the Caribbean Pilot Library.","pt":"Edifício patrimonial de 1921 que hoje abriga o Arquivo Histórico do Atlântico e a Biblioteca Piloto do Caribe."}'::jsonb, 'Vía 40 #36-135, Barlovento', extensions.st_setsrid(extensions.st_makepoint(-74.778876, 10.988413), 4326)::extensions.geography, '{"mon":[["08:00","17:00"]],"tue":[["08:00","17:00"]],"wed":[["08:00","17:00"]],"thu":[["08:00","17:00"]],"fri":[["08:00","17:00"]]}'::jsonb, 1, array['historia','arquitectura','cultura']::text[], false, 0.6, 'published'),
  ('cultural', (select id from public.place_categories where slug = 'centro_cultural'), 'Fábrica de Cultura', '{"es":"Escuela y centro cultural dedicado a las artes del Carnaval, la música y la danza del Caribe.","en":"School and cultural center devoted to Carnival arts, music and Caribbean dance.","pt":"Escola e centro cultural dedicado às artes do Carnaval, à música e à dança do Caribe."}'::jsonb, 'Calle 40 #46-223, Barlovento', extensions.st_setsrid(extensions.st_makepoint(-74.780847, 10.98859), 4326)::extensions.geography, '{"mon":[["08:00","20:00"]],"tue":[["08:00","20:00"]],"wed":[["08:00","20:00"]],"thu":[["08:00","20:00"]],"fri":[["08:00","20:00"]],"sat":[["08:00","20:00"]]}'::jsonb, 1, array['cultura','musica','arte']::text[], false, 0.65, 'published'),
  ('atractivo', (select id from public.place_categories where slug = 'plaza'), 'Paseo Bolívar', '{"es":"Gran bulevar del centro histórico con la estatua ecuestre de Simón Bolívar, comercio y vida de calle.","en":"Grand boulevard in the historic center with the equestrian statue of Simón Bolívar, shops and street life.","pt":"Grande bulevar do centro histórico com a estátua equestre de Simón Bolívar, comércio e vida de rua."}'::jsonb, 'Paseo Bolívar, Centro', extensions.st_setsrid(extensions.st_makepoint(-74.777529, 10.983325), 4326)::extensions.geography, null, 1, array['historia','compras']::text[], true, 0.75, 'published'),
  ('cultural', (select id from public.place_categories where slug = 'museo'), 'Museo del Atlántico', '{"es":"Museo sobre la historia del departamento del Atlántico, en una casona del centro de Barranquilla.","en":"Museum about the history of the Atlántico department, in a mansion in downtown Barranquilla.","pt":"Museu sobre a história do departamento do Atlántico, em um casarão do centro de Barranquilla."}'::jsonb, 'Carrera 39 #35-21, Centro', extensions.st_setsrid(extensions.st_makepoint(-74.779904, 10.97825), 4326)::extensions.geography, '{"tue":[["09:00","17:00"]],"wed":[["09:00","17:00"]],"thu":[["09:00","17:00"]],"fri":[["09:00","17:00"]],"sat":[["09:00","17:00"]],"sun":[["09:00","17:00"]]}'::jsonb, 1, array['historia','cultura']::text[], false, 0.45, 'published'),
  ('atractivo', (select id from public.place_categories where slug = 'plaza'), 'Plaza de San Roque', '{"es":"Plaza tradicional junto a la iglesia de San Roque, en uno de los barrios más antiguos de la ciudad.","en":"Traditional square next to San Roque church, in one of the oldest neighborhoods of the city.","pt":"Praça tradicional ao lado da igreja de San Roque, em um dos bairros mais antigos da cidade."}'::jsonb, 'Calle 30, San Roque', extensions.st_setsrid(extensions.st_makepoint(-74.777815, 10.975992), 4326)::extensions.geography, null, 1, array['historia','gastronomia']::text[], true, 0.4, 'published'),
  ('cultural', (select id from public.place_categories where slug = 'iglesia'), 'Catedral Metropolitana María Reina', '{"es":"Catedral moderna de la ciudad, con el Cristo Libertador de Arenas Betancourt sobre su fachada.","en":"The city''s modern cathedral, with Arenas Betancourt''s Cristo Libertador on its facade.","pt":"Catedral moderna da cidade, com o Cristo Libertador de Arenas Betancourt na fachada."}'::jsonb, 'Carrera 45 #53-38, Boston', extensions.st_setsrid(extensions.st_makepoint(-74.790568, 10.9885), 4326)::extensions.geography, '{"mon":[["07:00","19:00"]],"tue":[["07:00","19:00"]],"wed":[["07:00","19:00"]],"thu":[["07:00","19:00"]],"fri":[["07:00","19:00"]],"sat":[["07:00","19:00"]],"sun":[["07:00","19:00"]]}'::jsonb, 1, array['historia','arquitectura','cultura']::text[], false, 0.7, 'published'),
  ('atractivo', (select id from public.place_categories where slug = 'plaza'), 'Plaza de la Paz', '{"es":"Plaza frente a la catedral, escenario de conciertos, ferias y celebraciones del Carnaval.","en":"Square in front of the cathedral, venue for concerts, fairs and Carnival celebrations.","pt":"Praça em frente à catedral, palco de shows, feiras e celebrações do Carnaval."}'::jsonb, 'Carrera 45 con Calle 53', extensions.st_setsrid(extensions.st_makepoint(-74.789011, 10.988023), 4326)::extensions.geography, null, 1, array['cultura','musica','historia']::text[], true, 0.7, 'published'),
  ('cultural', (select id from public.place_categories where slug = 'teatro'), 'Teatro Amira de la Rosa', '{"es":"Principal teatro de la ciudad, sede de conciertos, ópera, danza y teatro.","en":"The main theater of the city, home to concerts, opera, dance and drama.","pt":"Principal teatro da cidade, sede de concertos, ópera, dança e teatro."}'::jsonb, 'Carrera 54 #52-258, Villa Country', extensions.st_setsrid(extensions.st_makepoint(-74.789648, 10.993451), 4326)::extensions.geography, '{"mon":[["10:00","22:00"]],"tue":[["10:00","22:00"]],"wed":[["10:00","22:00"]],"thu":[["10:00","22:00"]],"fri":[["10:00","22:00"]],"sat":[["10:00","22:00"]],"sun":[["10:00","22:00"]]}'::jsonb, 3, array['cultura','musica','arte']::text[], false, 0.6, 'published'),
  ('cultural', (select id from public.place_categories where slug = 'teatro'), 'Teatro José Consuegra Higgins', '{"es":"Teatro universitario con programación de artes escénicas y música.","en":"University theater with performing arts and music programming.","pt":"Teatro universitário com programação de artes cênicas e música."}'::jsonb, 'Calle 58, Modelo', extensions.st_setsrid(extensions.st_makepoint(-74.791874, 10.993863), 4326)::extensions.geography, '{"mon":[["09:00","21:00"]],"tue":[["09:00","21:00"]],"wed":[["09:00","21:00"]],"thu":[["09:00","21:00"]],"fri":[["09:00","21:00"]],"sat":[["09:00","21:00"]]}'::jsonb, 2, array['cultura','musica']::text[], false, 0.35, 'published'),
  ('atractivo', (select id from public.place_categories where slug = 'monumento'), 'Monumento a la Bandera', '{"es":"Monumento que recuerda la primera izada de la bandera de Barranquilla.","en":"Monument commemorating the first raising of Barranquilla''s flag.","pt":"Monumento que lembra o primeiro hasteamento da bandeira de Barranquilla."}'::jsonb, 'Avenida 11 de Noviembre, Montecristo', extensions.st_setsrid(extensions.st_makepoint(-74.791196, 10.993047), 4326)::extensions.geography, null, 1, array['historia']::text[], true, 0.3, 'published'),
  ('cultural', (select id from public.place_categories where slug = 'patrimonio'), 'Universidad del Atlántico, Sede Bellas Artes', '{"es":"Sede de Bellas Artes con exposiciones, conciertos y vida cultural universitaria.","en":"Fine Arts campus with exhibitions, concerts and university cultural life.","pt":"Sede de Belas Artes com exposições, concertos e vida cultural universitária."}'::jsonb, 'Carrera 43 #50-53, El Rosario', extensions.st_setsrid(extensions.st_makepoint(-74.789979, 10.98301), 4326)::extensions.geography, '{"mon":[["08:00","18:00"]],"tue":[["08:00","18:00"]],"wed":[["08:00","18:00"]],"thu":[["08:00","18:00"]],"fri":[["08:00","18:00"]]}'::jsonb, 1, array['arte','cultura','musica']::text[], false, 0.4, 'published'),
  ('cultural', (select id from public.place_categories where slug = 'patrimonio'), 'Cementerio Universal', '{"es":"Cementerio histórico con mausoleos y esculturas de valor patrimonial.","en":"Historic cemetery with mausoleums and sculptures of heritage value.","pt":"Cemitério histórico com mausoléus e esculturas de valor patrimonial."}'::jsonb, 'Calle 54, Chiquinquirá', extensions.st_setsrid(extensions.st_makepoint(-74.789436, 10.979099), 4326)::extensions.geography, '{"mon":[["08:00","17:00"]],"tue":[["08:00","17:00"]],"wed":[["08:00","17:00"]],"thu":[["08:00","17:00"]],"fri":[["08:00","17:00"]],"sat":[["08:00","17:00"]],"sun":[["08:00","17:00"]]}'::jsonb, 1, array['historia','arquitectura']::text[], true, 0.2, 'published'),
  ('atractivo', (select id from public.place_categories where slug = 'monumento'), 'Ventana de Campeones', '{"es":"Monumento que homenajea a los grandes deportistas barranquilleros, en la entrada del Gran Malecón.","en":"Monument honoring Barranquilla''s great athletes, at the entrance of the Gran Malecón.","pt":"Monumento que homenageia os grandes atletas de Barranquilla, na entrada do Gran Malecón."}'::jsonb, 'Rotonda Aleta del Tiburón', extensions.st_setsrid(extensions.st_makepoint(-74.772777, 10.99829), 4326)::extensions.geography, null, 2, array['futbol','deporte','historia']::text[], true, 0.55, 'published'),
  ('atractivo', (select id from public.place_categories where slug = 'parque'), 'Zoológico de Barranquilla', '{"es":"Zoológico con fauna del Caribe y de otras regiones, con programas de conservación y educación ambiental.","en":"Zoo with Caribbean wildlife and other regions, with conservation and environmental education programs.","pt":"Zoológico com fauna do Caribe e de outras regiões, com programas de conservação e educação ambiental."}'::jsonb, 'Calle 77 #68-40, La Concepción', extensions.st_setsrid(extensions.st_makepoint(-74.798, 11.010978), 4326)::extensions.geography, '{"mon":[["09:00","17:00"]],"tue":[["09:00","17:00"]],"wed":[["09:00","17:00"]],"thu":[["09:00","17:00"]],"fri":[["09:00","17:00"]],"sat":[["09:00","17:00"]],"sun":[["09:00","17:00"]]}'::jsonb, 2, array['naturaleza','familia']::text[], true, 0.75, 'published'),
  ('atractivo', (select id from public.place_categories where slug = 'parque'), 'Parque Sagrado Corazón', '{"es":"Parque de barrio con zonas verdes, juegos infantiles y espacios para caminar.","en":"Neighborhood park with green areas, playgrounds and walking paths.","pt":"Parque de bairro com áreas verdes, brinquedos infantis e espaços para caminhar."}'::jsonb, 'Ciudad Jardín', extensions.st_setsrid(extensions.st_makepoint(-74.818112, 10.993595), 4326)::extensions.geography, null, 2, array['familia','naturaleza']::text[], true, 0.3, 'published'),
  ('atractivo', (select id from public.place_categories where slug = 'parque'), 'Parque Washington', '{"es":"Parque tradicional del norte con árboles centenarios, senderos y actividades culturales.","en":"Traditional northern park with century-old trees, paths and cultural activities.","pt":"Parque tradicional do norte com árvores centenárias, trilhas e atividades culturais."}'::jsonb, 'Calle 79 con Carrera 55', extensions.st_setsrid(extensions.st_makepoint(-74.810989, 11.005487), 4326)::extensions.geography, null, 3, array['familia','naturaleza']::text[], true, 0.45, 'published'),
  ('atractivo', (select id from public.place_categories where slug = 'parque'), 'Parque Venezuela', '{"es":"Parque de barrio renovado con canchas, gimnasio al aire libre y zonas verdes.","en":"Renovated neighborhood park with courts, outdoor gym and green areas.","pt":"Parque de bairro renovado com quadras, academia ao ar livre e áreas verdes."}'::jsonb, 'La Campiña', extensions.st_setsrid(extensions.st_makepoint(-74.824172, 11.001456), 4326)::extensions.geography, null, 2, array['familia','deporte']::text[], true, 0.25, 'published'),
  ('atractivo', (select id from public.place_categories where slug = 'parque'), 'Parque Suri Salcedo', '{"es":"Parque recreativo y deportivo con canchas, pista de patinaje y zonas para la familia.","en":"Recreational and sports park with courts, skating rink and family areas.","pt":"Parque recreativo e esportivo com quadras, pista de patinação e áreas para a família."}'::jsonb, 'Calle 72 con Carrera 46', extensions.st_setsrid(extensions.st_makepoint(-74.804266, 10.994092), 4326)::extensions.geography, null, 2, array['deporte','familia']::text[], true, 0.4, 'published'),
  ('estadio', (select id from public.place_categories where slug = 'estadio'), 'Estadio Metropolitano Roberto Meléndez', '{"es":"Casa de la Selección Colombia y del Junior, el escenario mundialista de Barranquilla.","en":"Home of the Colombian national team and Junior, Barranquilla’s World Cup venue.","pt":"Casa da Seleção Colombiana e do Junior, o estádio mundialista de Barranquilla."}'::jsonb, 'Avenida Circunvalar, Ciudadela 20 de Julio', extensions.st_setsrid(extensions.st_makepoint(-74.800511, 10.926955), 4326)::extensions.geography, '{"mon":[["08:00","22:00"]],"tue":[["08:00","22:00"]],"wed":[["08:00","22:00"]],"thu":[["08:00","22:00"]],"fri":[["08:00","22:00"]],"sat":[["08:00","22:00"]],"sun":[["08:00","22:00"]]}'::jsonb, 2, array['futbol','deporte']::text[], true, 0.9, 'published'),
  ('estadio', (select id from public.place_categories where slug = 'estadio'), 'Estadio Romelio Martínez', '{"es":"Estadio histórico de la ciudad, escenario de fútbol, atletismo y eventos.","en":"Historic stadium of the city, venue for football, athletics and events.","pt":"Estádio histórico da cidade, palco de futebol, atletismo e eventos."}'::jsonb, 'Calle 72, Olaya', extensions.st_setsrid(extensions.st_makepoint(-74.807086, 10.993807), 4326)::extensions.geography, '{"mon":[["08:00","20:00"]],"tue":[["08:00","20:00"]],"wed":[["08:00","20:00"]],"thu":[["08:00","20:00"]],"fri":[["08:00","20:00"]],"sat":[["08:00","20:00"]],"sun":[["08:00","20:00"]]}'::jsonb, 1, array['futbol','deporte','historia']::text[], true, 0.45, 'published'),
  ('fan_zone', (select id from public.place_categories where slug = 'fan_zone'), 'Fan Zone Malecón Puerta de Oro', '{"es":"Zona de aficionados del Modo Mundial en el sector Puerta de Oro del Malecón: pantallas gigantes, música y comida.","en":"Modo Mundial fan zone at the Puerta de Oro sector of the Malecón: giant screens, music and food.","pt":"Fan zone do Modo Mundial no setor Puerta de Oro do Malecón: telões, música e comida."}'::jsonb, 'Malecón del Río, sector Puerta de Oro', extensions.st_setsrid(extensions.st_makepoint(-74.799473, 11.026082), 4326)::extensions.geography, null, 2, array['futbol','musica','gastronomia']::text[], true, 0.85, 'published'),
  ('atractivo', (select id from public.place_categories where slug = 'naturaleza'), 'Ecoparque Ciénaga de Mallorquín', '{"es":"Ecoparque con senderos y muelles sobre la ciénaga, manglares y avistamiento de aves.","en":"Eco-park with trails and piers over the lagoon, mangroves and birdwatching.","pt":"Ecoparque com trilhas e píeres sobre a lagoa, manguezais e observação de aves."}'::jsonb, 'Las Flores', extensions.st_setsrid(extensions.st_makepoint(-74.844505, 11.03501), 4326)::extensions.geography, '{"mon":[["07:00","17:00"]],"tue":[["07:00","17:00"]],"wed":[["07:00","17:00"]],"thu":[["07:00","17:00"]],"fri":[["07:00","17:00"]],"sat":[["07:00","17:00"]],"sun":[["07:00","17:00"]]}'::jsonb, 1, array['naturaleza','familia']::text[], true, 0.6, 'published'),
  ('atractivo', (select id from public.place_categories where slug = 'naturaleza'), 'Bocas de Ceniza', '{"es":"Desembocadura del río Magdalena en el mar Caribe, a la que se llega en el tradicional trencito.","en":"Mouth of the Magdalena River into the Caribbean Sea, reached by the traditional little train.","pt":"Foz do rio Magdalena no mar do Caribe, aonde se chega pelo tradicional trenzinho."}'::jsonb, 'Las Flores', extensions.st_setsrid(extensions.st_makepoint(-74.854733, 11.10649), 4326)::extensions.geography, '{"mon":[["06:00","17:00"]],"tue":[["06:00","17:00"]],"wed":[["06:00","17:00"]],"thu":[["06:00","17:00"]],"fri":[["06:00","17:00"]],"sat":[["06:00","17:00"]],"sun":[["06:00","17:00"]]}'::jsonb, 1, array['naturaleza']::text[], true, 0.5, 'published'),
  ('punto_habilitado', (select id from public.place_categories where slug = 'centro_cultural'), 'Punto QuillaPass Parque Cultural del Caribe', '{"es":"Punto habilitado del programa para registrar participación en actividades culturales.","en":"Program check-in point to register participation in cultural activities.","pt":"Ponto habilitado do programa para registrar participação em atividades culturais."}'::jsonb, 'Calle 36 con Carrera 46', extensions.st_setsrid(extensions.st_makepoint(-74.778009, 10.986383), 4326)::extensions.geography, null, 1, array['cultura']::text[], true, 0.5, 'published');

insert into public.place_accessibility (place_id, feature_id, level, verified_at)
select p.id, f.id, v.level, now()
  from (values
  ('Museo del Caribe', 'silla_ruedas', 'total'),
  ('Museo del Caribe', 'movilidad_reducida', 'total'),
  ('Museo del Caribe', 'baja_vision', 'parcial'),
  ('Museo del Caribe', 'auditiva', 'parcial'),
  ('Museo del Caribe', 'cognitiva', 'parcial'),
  ('Gran Malecón del Río', 'silla_ruedas', 'total'),
  ('Gran Malecón del Río', 'movilidad_reducida', 'total'),
  ('Gran Malecón del Río', 'baja_vision', 'parcial'),
  ('Gran Malecón del Río', 'auditiva', 'parcial'),
  ('Gran Malecón del Río', 'cognitiva', 'parcial'),
  ('Museo de Arte Moderno de Barranquilla', 'silla_ruedas', 'total'),
  ('Museo de Arte Moderno de Barranquilla', 'movilidad_reducida', 'total'),
  ('Museo de Arte Moderno de Barranquilla', 'baja_vision', 'parcial'),
  ('Museo de Arte Moderno de Barranquilla', 'auditiva', 'parcial'),
  ('Museo de Arte Moderno de Barranquilla', 'cognitiva', 'parcial'),
  ('Edificio de la Antigua Aduana', 'silla_ruedas', 'parcial'),
  ('Edificio de la Antigua Aduana', 'movilidad_reducida', 'parcial'),
  ('Edificio de la Antigua Aduana', 'baja_vision', 'parcial'),
  ('Edificio de la Antigua Aduana', 'auditiva', 'parcial'),
  ('Edificio de la Antigua Aduana', 'cognitiva', 'parcial'),
  ('Fábrica de Cultura', 'silla_ruedas', 'total'),
  ('Fábrica de Cultura', 'movilidad_reducida', 'total'),
  ('Fábrica de Cultura', 'baja_vision', 'parcial'),
  ('Fábrica de Cultura', 'auditiva', 'parcial'),
  ('Fábrica de Cultura', 'cognitiva', 'parcial'),
  ('Paseo Bolívar', 'silla_ruedas', 'parcial'),
  ('Paseo Bolívar', 'movilidad_reducida', 'parcial'),
  ('Paseo Bolívar', 'baja_vision', 'parcial'),
  ('Paseo Bolívar', 'auditiva', 'parcial'),
  ('Paseo Bolívar', 'cognitiva', 'parcial'),
  ('Museo del Atlántico', 'silla_ruedas', 'no'),
  ('Museo del Atlántico', 'movilidad_reducida', 'parcial'),
  ('Museo del Atlántico', 'baja_vision', 'parcial'),
  ('Museo del Atlántico', 'auditiva', 'parcial'),
  ('Museo del Atlántico', 'cognitiva', 'parcial'),
  ('Plaza de San Roque', 'silla_ruedas', 'parcial'),
  ('Plaza de San Roque', 'movilidad_reducida', 'parcial'),
  ('Plaza de San Roque', 'baja_vision', 'parcial'),
  ('Plaza de San Roque', 'auditiva', 'parcial'),
  ('Plaza de San Roque', 'cognitiva', 'parcial'),
  ('Catedral Metropolitana María Reina', 'silla_ruedas', 'total'),
  ('Catedral Metropolitana María Reina', 'movilidad_reducida', 'total'),
  ('Catedral Metropolitana María Reina', 'baja_vision', 'parcial'),
  ('Catedral Metropolitana María Reina', 'auditiva', 'parcial'),
  ('Catedral Metropolitana María Reina', 'cognitiva', 'parcial'),
  ('Plaza de la Paz', 'silla_ruedas', 'total'),
  ('Plaza de la Paz', 'movilidad_reducida', 'total'),
  ('Plaza de la Paz', 'baja_vision', 'parcial'),
  ('Plaza de la Paz', 'auditiva', 'parcial'),
  ('Plaza de la Paz', 'cognitiva', 'parcial'),
  ('Teatro Amira de la Rosa', 'silla_ruedas', 'total'),
  ('Teatro Amira de la Rosa', 'movilidad_reducida', 'total'),
  ('Teatro Amira de la Rosa', 'baja_vision', 'parcial'),
  ('Teatro Amira de la Rosa', 'auditiva', 'parcial'),
  ('Teatro Amira de la Rosa', 'cognitiva', 'parcial'),
  ('Teatro José Consuegra Higgins', 'silla_ruedas', 'parcial'),
  ('Teatro José Consuegra Higgins', 'movilidad_reducida', 'parcial'),
  ('Teatro José Consuegra Higgins', 'baja_vision', 'parcial'),
  ('Teatro José Consuegra Higgins', 'auditiva', 'parcial'),
  ('Teatro José Consuegra Higgins', 'cognitiva', 'parcial'),
  ('Monumento a la Bandera', 'silla_ruedas', 'parcial'),
  ('Monumento a la Bandera', 'movilidad_reducida', 'parcial'),
  ('Monumento a la Bandera', 'baja_vision', 'parcial'),
  ('Monumento a la Bandera', 'auditiva', 'parcial'),
  ('Monumento a la Bandera', 'cognitiva', 'parcial'),
  ('Universidad del Atlántico, Sede Bellas Artes', 'silla_ruedas', 'parcial'),
  ('Universidad del Atlántico, Sede Bellas Artes', 'movilidad_reducida', 'parcial'),
  ('Universidad del Atlántico, Sede Bellas Artes', 'baja_vision', 'parcial'),
  ('Universidad del Atlántico, Sede Bellas Artes', 'auditiva', 'parcial'),
  ('Universidad del Atlántico, Sede Bellas Artes', 'cognitiva', 'parcial'),
  ('Cementerio Universal', 'silla_ruedas', 'no'),
  ('Cementerio Universal', 'movilidad_reducida', 'parcial'),
  ('Cementerio Universal', 'baja_vision', 'parcial'),
  ('Cementerio Universal', 'auditiva', 'parcial'),
  ('Cementerio Universal', 'cognitiva', 'parcial'),
  ('Ventana de Campeones', 'silla_ruedas', 'total'),
  ('Ventana de Campeones', 'movilidad_reducida', 'total'),
  ('Ventana de Campeones', 'baja_vision', 'parcial'),
  ('Ventana de Campeones', 'auditiva', 'parcial'),
  ('Ventana de Campeones', 'cognitiva', 'parcial'),
  ('Zoológico de Barranquilla', 'silla_ruedas', 'total'),
  ('Zoológico de Barranquilla', 'movilidad_reducida', 'total'),
  ('Zoológico de Barranquilla', 'baja_vision', 'parcial'),
  ('Zoológico de Barranquilla', 'auditiva', 'parcial'),
  ('Zoológico de Barranquilla', 'cognitiva', 'parcial'),
  ('Parque Sagrado Corazón', 'silla_ruedas', 'total'),
  ('Parque Sagrado Corazón', 'movilidad_reducida', 'total'),
  ('Parque Sagrado Corazón', 'baja_vision', 'parcial'),
  ('Parque Sagrado Corazón', 'auditiva', 'parcial'),
  ('Parque Sagrado Corazón', 'cognitiva', 'parcial'),
  ('Parque Washington', 'silla_ruedas', 'total'),
  ('Parque Washington', 'movilidad_reducida', 'total'),
  ('Parque Washington', 'baja_vision', 'parcial'),
  ('Parque Washington', 'auditiva', 'parcial'),
  ('Parque Washington', 'cognitiva', 'parcial'),
  ('Parque Venezuela', 'silla_ruedas', 'parcial'),
  ('Parque Venezuela', 'movilidad_reducida', 'parcial'),
  ('Parque Venezuela', 'baja_vision', 'parcial'),
  ('Parque Venezuela', 'auditiva', 'parcial'),
  ('Parque Venezuela', 'cognitiva', 'parcial'),
  ('Parque Suri Salcedo', 'silla_ruedas', 'total'),
  ('Parque Suri Salcedo', 'movilidad_reducida', 'total'),
  ('Parque Suri Salcedo', 'baja_vision', 'parcial'),
  ('Parque Suri Salcedo', 'auditiva', 'parcial'),
  ('Parque Suri Salcedo', 'cognitiva', 'parcial'),
  ('Estadio Metropolitano Roberto Meléndez', 'silla_ruedas', 'total'),
  ('Estadio Metropolitano Roberto Meléndez', 'movilidad_reducida', 'total'),
  ('Estadio Metropolitano Roberto Meléndez', 'baja_vision', 'parcial'),
  ('Estadio Metropolitano Roberto Meléndez', 'auditiva', 'parcial'),
  ('Estadio Metropolitano Roberto Meléndez', 'cognitiva', 'parcial'),
  ('Estadio Romelio Martínez', 'silla_ruedas', 'parcial'),
  ('Estadio Romelio Martínez', 'movilidad_reducida', 'parcial'),
  ('Estadio Romelio Martínez', 'baja_vision', 'parcial'),
  ('Estadio Romelio Martínez', 'auditiva', 'parcial'),
  ('Estadio Romelio Martínez', 'cognitiva', 'parcial'),
  ('Fan Zone Malecón Puerta de Oro', 'silla_ruedas', 'total'),
  ('Fan Zone Malecón Puerta de Oro', 'movilidad_reducida', 'total'),
  ('Fan Zone Malecón Puerta de Oro', 'baja_vision', 'parcial'),
  ('Fan Zone Malecón Puerta de Oro', 'auditiva', 'parcial'),
  ('Fan Zone Malecón Puerta de Oro', 'cognitiva', 'parcial'),
  ('Ecoparque Ciénaga de Mallorquín', 'silla_ruedas', 'parcial'),
  ('Ecoparque Ciénaga de Mallorquín', 'movilidad_reducida', 'parcial'),
  ('Ecoparque Ciénaga de Mallorquín', 'baja_vision', 'parcial'),
  ('Ecoparque Ciénaga de Mallorquín', 'auditiva', 'parcial'),
  ('Ecoparque Ciénaga de Mallorquín', 'cognitiva', 'parcial'),
  ('Bocas de Ceniza', 'silla_ruedas', 'no'),
  ('Bocas de Ceniza', 'movilidad_reducida', 'parcial'),
  ('Bocas de Ceniza', 'baja_vision', 'parcial'),
  ('Bocas de Ceniza', 'auditiva', 'parcial'),
  ('Bocas de Ceniza', 'cognitiva', 'parcial'),
  ('Punto QuillaPass Parque Cultural del Caribe', 'silla_ruedas', 'total'),
  ('Punto QuillaPass Parque Cultural del Caribe', 'movilidad_reducida', 'total'),
  ('Punto QuillaPass Parque Cultural del Caribe', 'baja_vision', 'parcial'),
  ('Punto QuillaPass Parque Cultural del Caribe', 'auditiva', 'parcial'),
  ('Punto QuillaPass Parque Cultural del Caribe', 'cognitiva', 'parcial')) as v(place, feature, level)
  join public.places p on p.name = v.place
  join public.accessibility_features f on f.slug = v.feature;

insert into public.merchants (trade_name, legal_name, nit, status) values
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

insert into public.price_reference_items (slug, name_i18n, unit, category, created_by) values
  ('agua_600ml', '{"es":"Agua embotellada 600 ml","en":"Bottled water 600 ml","pt":"Água engarrafada 600 ml"}'::jsonb, 'botella 600 ml', 'bebidas', 'seed'),
  ('cerveza_nacional_330ml', '{"es":"Cerveza nacional 330 ml","en":"Local beer 330 ml","pt":"Cerveja nacional 330 ml"}'::jsonb, 'botella o lata 330 ml', 'bebidas', 'seed'),
  ('jugo_natural_12oz', '{"es":"Jugo natural 12 oz","en":"Fresh juice 12 oz","pt":"Suco natural 12 oz"}'::jsonb, 'vaso 12 oz', 'bebidas', 'seed'),
  ('arepa_huevo', '{"es":"Arepa de huevo","en":"Egg arepa","pt":"Arepa de ovo"}'::jsonb, 'unidad', 'comida', 'seed'),
  ('carimanola', '{"es":"Carimañola","en":"Carimañola","pt":"Carimañola"}'::jsonb, 'unidad', 'comida', 'seed'),
  ('butifarra_3und', '{"es":"Butifarra (3 unidades)","en":"Butifarra sausage (3 pieces)","pt":"Butifarra (3 unidades)"}'::jsonb, 'porción de 3 unidades', 'comida', 'seed'),
  ('raspao', '{"es":"Raspao (granizado)","en":"Raspao (shaved ice)","pt":"Raspao (raspadinha)"}'::jsonb, 'vaso', 'bebidas', 'seed');

insert into public.price_observations (reference_item_id, zone_id, price_cop, source, weight, observed_at)
select i.id, z.id, v.price, v.source, v.weight, now() - make_interval(days => v.days_ago)
  from (values
  ('agua_600ml', 'gran-malecon', 3500, 'encuesta_campo', 1.0, 3),
  ('agua_600ml', 'gran-malecon', 4000, 'compra_app', 0.8, 5),
  ('agua_600ml', 'barrio-abajo', 2000, 'encuesta_campo', 1.0, 3),
  ('agua_600ml', 'barrio-abajo', 2200, 'encuesta_campo', 1.0, 5),
  ('agua_600ml', 'barrio-abajo', 2500, 'encuesta_campo', 1.0, 7),
  ('agua_600ml', 'barrio-abajo', 2000, 'encuesta_campo', 1.0, 9),
  ('agua_600ml', 'barrio-abajo', 2800, 'encuesta_campo', 1.0, 11),
  ('agua_600ml', 'barrio-abajo', 2300, 'encuesta_campo', 1.0, 13),
  ('agua_600ml', 'barrio-abajo', 2200, 'encuesta_campo', 1.0, 15),
  ('agua_600ml', 'barrio-abajo', 2500, 'encuesta_campo', 1.0, 17),
  ('agua_600ml', 'barrio-abajo', 2400, 'encuesta_campo', 1.0, 19),
  ('agua_600ml', 'centro', 1800, 'encuesta_campo', 1.0, 3),
  ('agua_600ml', 'centro', 2000, 'encuesta_campo', 1.0, 5),
  ('agua_600ml', 'centro', 2200, 'encuesta_campo', 1.0, 7),
  ('agua_600ml', 'centro', 2000, 'encuesta_campo', 1.0, 9),
  ('agua_600ml', 'centro', 1900, 'encuesta_campo', 1.0, 11),
  ('agua_600ml', 'el-prado', 2500, 'encuesta_campo', 1.0, 3),
  ('agua_600ml', 'el-prado', 3000, 'encuesta_campo', 1.0, 5),
  ('agua_600ml', 'el-prado', 2800, 'encuesta_campo', 1.0, 7),
  ('agua_600ml', 'rebolo', 1500, 'encuesta_campo', 1.0, 3),
  ('agua_600ml', 'rebolo', 1800, 'encuesta_campo', 1.0, 5),
  ('agua_600ml', 'rebolo', 1700, 'encuesta_campo', 1.0, 7),
  ('cerveza_nacional_330ml', 'gran-malecon', 5000, 'encuesta_campo', 1.0, 3),
  ('cerveza_nacional_330ml', 'gran-malecon', 6000, 'encuesta_campo', 1.0, 5),
  ('cerveza_nacional_330ml', 'gran-malecon', 6500, 'encuesta_campo', 1.0, 7),
  ('cerveza_nacional_330ml', 'gran-malecon', 7000, 'encuesta_campo', 1.0, 9),
  ('cerveza_nacional_330ml', 'gran-malecon', 5500, 'encuesta_campo', 1.0, 11),
  ('cerveza_nacional_330ml', 'barrio-abajo', 3500, 'encuesta_campo', 1.0, 3),
  ('cerveza_nacional_330ml', 'barrio-abajo', 4000, 'encuesta_campo', 1.0, 5),
  ('cerveza_nacional_330ml', 'barrio-abajo', 3800, 'encuesta_campo', 1.0, 7),
  ('cerveza_nacional_330ml', 'barrio-abajo', 4200, 'encuesta_campo', 1.0, 9),
  ('cerveza_nacional_330ml', 'centro', 3000, 'encuesta_campo', 1.0, 3),
  ('cerveza_nacional_330ml', 'centro', 3500, 'encuesta_campo', 1.0, 5),
  ('cerveza_nacional_330ml', 'centro', 3500, 'encuesta_campo', 1.0, 7),
  ('jugo_natural_12oz', 'gran-malecon', 6000, 'encuesta_campo', 1.0, 3),
  ('jugo_natural_12oz', 'gran-malecon', 7000, 'encuesta_campo', 1.0, 5),
  ('jugo_natural_12oz', 'gran-malecon', 6500, 'encuesta_campo', 1.0, 7),
  ('jugo_natural_12oz', 'barrio-abajo', 3500, 'encuesta_campo', 1.0, 3),
  ('jugo_natural_12oz', 'barrio-abajo', 4000, 'encuesta_campo', 1.0, 5),
  ('jugo_natural_12oz', 'barrio-abajo', 4500, 'encuesta_campo', 1.0, 7),
  ('jugo_natural_12oz', 'barrio-abajo', 4000, 'encuesta_campo', 1.0, 9),
  ('jugo_natural_12oz', 'centro', 3000, 'encuesta_campo', 1.0, 3),
  ('jugo_natural_12oz', 'centro', 3500, 'encuesta_campo', 1.0, 5),
  ('arepa_huevo', 'barrio-abajo', 3500, 'encuesta_campo', 1.0, 3),
  ('arepa_huevo', 'barrio-abajo', 4000, 'encuesta_campo', 1.0, 5),
  ('arepa_huevo', 'barrio-abajo', 4500, 'encuesta_campo', 1.0, 7),
  ('arepa_huevo', 'barrio-abajo', 4000, 'encuesta_campo', 1.0, 9),
  ('arepa_huevo', 'barrio-abajo', 3800, 'encuesta_campo', 1.0, 11),
  ('arepa_huevo', 'barrio-abajo', 4200, 'encuesta_campo', 1.0, 13),
  ('arepa_huevo', 'barrio-abajo', 3500, 'encuesta_campo', 1.0, 15),
  ('arepa_huevo', 'barrio-abajo', 4000, 'encuesta_campo', 1.0, 17),
  ('arepa_huevo', 'centro', 3000, 'encuesta_campo', 1.0, 3),
  ('arepa_huevo', 'centro', 3500, 'encuesta_campo', 1.0, 5),
  ('arepa_huevo', 'centro', 3500, 'encuesta_campo', 1.0, 7),
  ('arepa_huevo', 'gran-malecon', 5000, 'encuesta_campo', 1.0, 3),
  ('arepa_huevo', 'gran-malecon', 5500, 'encuesta_campo', 1.0, 5),
  ('carimanola', 'barrio-abajo', 2500, 'encuesta_campo', 1.0, 3),
  ('carimanola', 'barrio-abajo', 2500, 'encuesta_campo', 1.0, 5),
  ('carimanola', 'barrio-abajo', 3000, 'encuesta_campo', 1.0, 7),
  ('carimanola', 'barrio-abajo', 2000, 'encuesta_campo', 1.0, 9),
  ('carimanola', 'barrio-abajo', 2800, 'encuesta_campo', 1.0, 11),
  ('carimanola', 'centro', 2000, 'encuesta_campo', 1.0, 3),
  ('carimanola', 'centro', 2200, 'encuesta_campo', 1.0, 5),
  ('carimanola', 'centro', 2500, 'encuesta_campo', 1.0, 7),
  ('butifarra_3und', 'gran-malecon', 4000, 'encuesta_campo', 1.0, 3),
  ('butifarra_3und', 'gran-malecon', 4500, 'encuesta_campo', 1.0, 5),
  ('butifarra_3und', 'gran-malecon', 3500, 'encuesta_campo', 1.0, 7),
  ('butifarra_3und', 'barrio-abajo', 3000, 'encuesta_campo', 1.0, 3),
  ('butifarra_3und', 'barrio-abajo', 3500, 'encuesta_campo', 1.0, 5),
  ('butifarra_3und', 'barrio-abajo', 3000, 'encuesta_campo', 1.0, 7),
  ('raspao', 'gran-malecon', 3000, 'encuesta_campo', 1.0, 3),
  ('raspao', 'gran-malecon', 3500, 'encuesta_campo', 1.0, 5),
  ('raspao', 'centro', 1500, 'encuesta_campo', 1.0, 3),
  ('raspao', 'centro', 2000, 'encuesta_campo', 1.0, 5),
  ('raspao', 'centro', 2000, 'encuesta_campo', 1.0, 7)) as v(item, zone, price, source, weight, days_ago)
  join public.price_reference_items i on i.slug = v.item
  join public.zones z on z.slug = v.zone;

insert into public.price_references (reference_item_id, zone_id, low_cop, median_cop, high_cop, method, sample_size, confidence, rationale_i18n, valid_until)
select i.id, z.id, v.low, v.median, v.high, 'manual', v.n, v.conf, v.rationale, now() + interval '30 days'
  from (values
  ('agua_600ml', 'gran-malecon', 2500, 3500, 4500, 0.3, 2, '{"es":"En el Gran Malecón un agua de 600 ml suele costar entre $2.500 y $4.500; es más que en barrios cercanos por ser zona turística.","en":"At the Gran Malecón a 600 ml water usually costs between $2,500 and $4,500; more than nearby neighborhoods because it is a tourist area.","pt":"No Gran Malecón uma água de 600 ml costuma custar entre $2.500 e $4.500; mais que nos bairros próximos por ser zona turística."}'::jsonb),
  ('cerveza_nacional_330ml', 'gran-malecon', 4500, 6000, 7500, 0.55, 5, '{"es":"Una cerveza nacional en el Gran Malecón suele costar entre $4.500 y $7.500.","en":"A local beer at the Gran Malecón usually costs $4,500 to $7,500.","pt":"Uma cerveja nacional no Gran Malecón costuma custar entre $4.500 e $7.500."}'::jsonb),
  ('jugo_natural_12oz', 'gran-malecon', 5000, 6500, 8000, 0.4, 3, '{"es":"Un jugo natural de 12 oz en el Gran Malecón suele costar entre $5.000 y $8.000.","en":"A 12 oz fresh juice at the Gran Malecón usually costs $5,000 to $8,000.","pt":"Um suco natural de 12 oz no Gran Malecón costuma custar entre $5.000 e $8.000."}'::jsonb),
  ('butifarra_3und', 'gran-malecon', 3000, 4000, 5000, 0.4, 3, '{"es":"Tres butifarras en el Gran Malecón suelen costar entre $3.000 y $5.000.","en":"Three butifarras at the Gran Malecón usually cost $3,000 to $5,000.","pt":"Três butifarras no Gran Malecón costumam custar entre $3.000 e $5.000."}'::jsonb),
  ('arepa_huevo', 'barrio-abajo', 3000, 4000, 5000, 0.85, 8, '{"es":"En Barrio Abajo una arepa de huevo suele costar entre $3.000 y $5.000.","en":"In Barrio Abajo an egg arepa usually costs $3,000 to $5,000.","pt":"No Barrio Abajo uma arepa de ovo costuma custar entre $3.000 e $5.000."}'::jsonb),
  ('carimanola', 'barrio-abajo', 2000, 2500, 3000, 0.55, 5, '{"es":"En Barrio Abajo una carimañola suele costar entre $2.000 y $3.000.","en":"In Barrio Abajo a carimañola usually costs $2,000 to $3,000.","pt":"No Barrio Abajo uma carimañola costuma custar entre $2.000 e $3.000."}'::jsonb),
  ('agua_600ml', 'barrio-abajo', 1800, 2200, 2800, 0.85, 9, '{"es":"En Barrio Abajo un agua de 600 ml suele costar entre $1.800 y $2.800.","en":"In Barrio Abajo a 600 ml water usually costs $1,800 to $2,800.","pt":"No Barrio Abajo uma água de 600 ml costuma custar entre $1.800 e $2.800."}'::jsonb)) as v(item, zone, low, median, high, conf, n, rationale)
  join public.price_reference_items i on i.slug = v.item
  join public.zones z on z.slug = v.zone;

insert into public.products (merchant_id, place_id, reference_item_id, name, unit, price_cop, description_i18n)
select m.id, p.id, i.id, v.name, v.unit, v.price, v.descr
  from (values
  ('Kiosco Brisa del Río', 'agua_600ml', 'Agua 600 ml', 'botella 600 ml', 6000, '{"es":"Agua embotellada fría.","en":"Cold bottled water.","pt":"Água engarrafada gelada."}'::jsonb),
  ('Kiosco Brisa del Río', 'cerveza_nacional_330ml', 'Cerveza nacional', 'botella 330 ml', 7000, '{"es":"Cerveza nacional bien fría.","en":"Ice-cold local beer.","pt":"Cerveja nacional bem gelada."}'::jsonb),
  ('Kiosco Brisa del Río', 'jugo_natural_12oz', 'Jugo natural de mango', 'vaso 12 oz', 8000, '{"es":"Jugo natural de mango.","en":"Fresh mango juice.","pt":"Suco natural de manga."}'::jsonb),
  ('Kiosco Brisa del Río', 'butifarra_3und', 'Butifarras (3)', '3 unidades', 5000, '{"es":"Butifarras soledeñas con limón.","en":"Soledad-style butifarras with lime.","pt":"Butifarras de Soledad com limão."}'::jsonb),
  ('Arepas La Cuarenta', 'arepa_huevo', 'Arepa de huevo', 'unidad', 4000, '{"es":"Arepa de huevo con carne molida.","en":"Egg arepa with ground beef.","pt":"Arepa de ovo com carne moída."}'::jsonb),
  ('Arepas La Cuarenta', 'carimanola', 'Carimañola', 'unidad', 3000, '{"es":"Carimañola de queso.","en":"Cheese carimañola.","pt":"Carimañola de queijo."}'::jsonb),
  ('Arepas La Cuarenta', 'agua_600ml', 'Agua 600 ml', 'botella 600 ml', 2500, '{"es":"Agua embotellada.","en":"Bottled water.","pt":"Água engarrafada."}'::jsonb),
  ('Arepas La Cuarenta', null, 'Jugo de corozo', 'vaso 12 oz', 4000, '{"es":"Jugo natural de corozo, fruta típica del Caribe.","en":"Fresh corozo juice, a typical Caribbean fruit.","pt":"Suco natural de corozo, fruta típica do Caribe."}'::jsonb)) as v(merchant, item, name, unit, price, descr)
  join public.merchants m on m.trade_name = v.merchant
  join public.places p on p.merchant_id = m.id
  left join public.price_reference_items i on i.slug = v.item;

insert into public.events (place_id, title_i18n, description_i18n, starts_at, ends_at, is_mundial, price_cop, capacity) values
  ((select id from public.places where name = 'Fan Zone Malecón Puerta de Oro'), '{"es":"Fan Fest Modo Mundial","en":"Modo Mundial Fan Fest","pt":"Fan Fest Modo Mundial"}'::jsonb, '{"es":"Pantallas gigantes, música en vivo y comida típica para vivir el Mundial en el Malecón.","en":"Giant screens, live music and local food to enjoy the World Cup at the Malecón.","pt":"Telões, música ao vivo e comida típica para viver a Copa no Malecón."}'::jsonb, (date_trunc('day', now() at time zone 'America/Bogota') + interval '9 hours') at time zone 'America/Bogota', (date_trunc('day', now() at time zone 'America/Bogota') + interval '4 days 23 hours') at time zone 'America/Bogota', true, null, 5000),
  ((select id from public.places where name = 'Estadio Metropolitano Roberto Meléndez'), '{"es":"Partido de la Selección en pantalla gigante","en":"National team match on the giant screen","pt":"Jogo da Seleção no telão"}'::jsonb, '{"es":"Transmisión del partido de la Selección Colombia con actividades para toda la familia.","en":"Broadcast of the Colombian national team match with family activities.","pt":"Transmissão do jogo da Seleção Colombiana com atividades para toda a família."}'::jsonb, (date_trunc('day', now() at time zone 'America/Bogota') + interval '1 day 18 hours') at time zone 'America/Bogota', (date_trunc('day', now() at time zone 'America/Bogota') + interval '1 day 22 hours') at time zone 'America/Bogota', true, 25000, 20000),
  ((select id from public.places where name = 'Fábrica de Cultura'), '{"es":"Noche de tambó en la Fábrica de Cultura","en":"Tambó night at Fábrica de Cultura","pt":"Noite de tambó na Fábrica de Cultura"}'::jsonb, '{"es":"Rueda de tambó con músicos y bailadores de la escuela de Carnaval.","en":"Drum circle with musicians and dancers from the Carnival school.","pt":"Roda de tambó com músicos e dançarinos da escola de Carnaval."}'::jsonb, (date_trunc('day', now() at time zone 'America/Bogota') + interval '1 day 19 hours') at time zone 'America/Bogota', (date_trunc('day', now() at time zone 'America/Bogota') + interval '1 day 23 hours') at time zone 'America/Bogota', false, null, 200),
  ((select id from public.places where name = 'Museo del Caribe'), '{"es":"Visita guiada nocturna al Museo del Caribe","en":"Night guided tour of Museo del Caribe","pt":"Visita guiada noturna ao Museo del Caribe"}'::jsonb, '{"es":"Recorrido guiado por las salas del museo con intérprete de lengua de señas.","en":"Guided tour of the museum halls with a sign language interpreter.","pt":"Visita guiada pelas salas do museu com intérprete de língua de sinais."}'::jsonb, (date_trunc('day', now() at time zone 'America/Bogota') + interval '2 days 18 hours') at time zone 'America/Bogota', (date_trunc('day', now() at time zone 'America/Bogota') + interval '2 days 21 hours') at time zone 'America/Bogota', false, null, 60),
  ((select id from public.places where name = 'Teatro Amira de la Rosa'), '{"es":"Concierto de la Orquesta Sinfónica del Caribe","en":"Caribbean Symphony Orchestra concert","pt":"Concerto da Orquestra Sinfônica do Caribe"}'::jsonb, '{"es":"Repertorio de música del Caribe y clásicos del Mundial en versión sinfónica.","en":"Caribbean music and World Cup classics in symphonic version.","pt":"Música do Caribe e clássicos da Copa em versão sinfônica."}'::jsonb, (date_trunc('day', now() at time zone 'America/Bogota') + interval '3 days 20 hours') at time zone 'America/Bogota', (date_trunc('day', now() at time zone 'America/Bogota') + interval '3 days 22 hours') at time zone 'America/Bogota', true, 30000, 900),
  ((select id from public.places where name = 'Gran Malecón del Río'), '{"es":"Feria gastronómica del Gran Malecón","en":"Gran Malecón food fair","pt":"Feira gastronômica do Gran Malecón"}'::jsonb, '{"es":"Cocineras tradicionales del Atlántico con platos típicos a precio justo.","en":"Traditional Atlántico cooks with typical dishes at fair prices.","pt":"Cozinheiras tradicionais do Atlántico com pratos típicos a preço justo."}'::jsonb, (date_trunc('day', now() at time zone 'America/Bogota') + interval '2 days 12 hours') at time zone 'America/Bogota', (date_trunc('day', now() at time zone 'America/Bogota') + interval '2 days 22 hours') at time zone 'America/Bogota', false, null, null);

insert into public.inclusion_bonus_rules (name, criteria, bonus_type, value, priority) values
  ('Bonificación de inclusión por accesibilidad', '{"accessibility_needs": "any"}', 'percent', 20, 100),
  ('Bonificación para personas mayores', '{"age_gte": 60}', 'percent', 20, 90),
  ('Bonificación por descubrir tu ciudad', '{"user_type": "residente", "zone_is_tourist": false}', 'percent', 25, 80);

insert into public.activities (place_id, event_id, title_i18n, description_i18n, activity_type, base_credits, valid_from, valid_to, per_user_period, max_per_user, global_cap, checkin_radius_m, checkin_method, status) values
  ((select id from public.places where name = 'Museo del Caribe'), null, '{"es":"Visita guiada al Museo del Caribe","en":"Guided visit to Museo del Caribe","pt":"Visita guiada ao Museo del Caribe"}'::jsonb, '{"es":"Recorre las salas del museo y registra tu participación en el punto habilitado.","en":"Tour the museum halls and check in at the enabled point.","pt":"Percorra as salas do museu e registre sua participação no ponto habilitado."}'::jsonb, 'visita', 100, now() - interval '1 day', now() + interval '45 days', 'total', 1, null, 150, 'geo', 'published'),
  ((select id from public.places where name = 'Gran Malecón del Río'), null, '{"es":"Recorrido por el Gran Malecón","en":"Gran Malecón walk","pt":"Passeio pelo Gran Malecón"}'::jsonb, '{"es":"Camina el Gran Malecón y conoce sus miradores. Puedes registrarlo una vez al día.","en":"Walk the Gran Malecón and its viewpoints. You can check in once a day.","pt":"Caminhe pelo Gran Malecón e conheça seus mirantes. Registro uma vez por dia."}'::jsonb, 'ruta', 50, now() - interval '1 day', now() + interval '45 days', 'day', 1, null, 300, 'geo', 'published'),
  ((select id from public.places where name = 'Fábrica de Cultura'), null, '{"es":"Taller de tambora en la Fábrica de Cultura","en":"Tambora drum workshop at Fábrica de Cultura","pt":"Oficina de tambora na Fábrica de Cultura"}'::jsonb, '{"es":"Aprende los ritmos del Carnaval con maestros de la escuela.","en":"Learn Carnival rhythms with the school masters.","pt":"Aprenda os ritmos do Carnaval com os mestres da escola."}'::jsonb, 'evento', 150, now() - interval '1 day', now() + interval '45 days', 'total', 1, 40, 150, 'geo', 'published'),
  ((select id from public.places where name = 'Ecoparque Ciénaga de Mallorquín'), null, '{"es":"Jornada de limpieza en la Ciénaga de Mallorquín","en":"Clean-up day at Ciénaga de Mallorquín","pt":"Mutirão de limpeza na Ciénaga de Mallorquín"}'::jsonb, '{"es":"Voluntariado ambiental para cuidar el manglar y la ciénaga.","en":"Environmental volunteering to care for the mangrove and lagoon.","pt":"Voluntariado ambiental para cuidar do manguezal e da lagoa."}'::jsonb, 'voluntariado', 300, now() - interval '1 day', now() + interval '45 days', 'total', 1, 50, 200, 'geo', 'published'),
  ((select id from public.places where name = 'Fan Zone Malecón Puerta de Oro'), (select id from public.events where title_i18n ->> 'es' = 'Fan Fest Modo Mundial'), '{"es":"Vive el Fan Fest Modo Mundial","en":"Join the Modo Mundial Fan Fest","pt":"Viva o Fan Fest Modo Mundial"}'::jsonb, '{"es":"Registra tu visita al Fan Fest y gana créditos cada día del evento.","en":"Check in at the Fan Fest and earn credits every day of the event.","pt":"Registre sua visita ao Fan Fest e ganhe créditos todos os dias do evento."}'::jsonb, 'evento', 80, now() - interval '1 day', now() + interval '45 days', 'day', 1, null, 300, 'geo', 'published'),
  ((select id from public.places where name = 'Ventana de Campeones'), null, '{"es":"Visita la Ventana de Campeones","en":"Visit the Ventana de Campeones","pt":"Visite a Ventana de Campeones"}'::jsonb, '{"es":"Conoce el homenaje a los campeones barranquilleros.","en":"Discover the tribute to Barranquilla''s champions.","pt":"Conheça a homenagem aos campeões de Barranquilla."}'::jsonb, 'visita', 50, now() - interval '1 day', now() + interval '45 days', 'total', 1, null, 150, 'geo', 'published');

insert into public.benefits (merchant_id, place_id, title_i18n, terms_i18n, discount_type, discount_value, max_discount_cop, applies_to, cost_credits, stock_total, stock_left, per_user_limit, redeem_until, use_days, funded_by, status)
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

insert into public.map_alerts (type, severity, title_i18n, message_i18n, geom, starts_at, ends_at, source) values
  ('arroyo', 'precaucion',
   '{"es":"Precaución: arroyo de Rebolo","en":"Caution: Rebolo stream","pt":"Atenção: córrego de Rebolo"}',
   '{"es":"Con lluvia, evita cruzar el arroyo de Rebolo. Usa rutas alternas.","en":"When it rains, avoid crossing the Rebolo stream. Use alternative routes.","pt":"Com chuva, evite atravessar o córrego de Rebolo. Use rotas alternativas."}',
   extensions.st_buffer(extensions.st_setsrid(extensions.st_makeline(extensions.st_makepoint(-74.7880, 10.9600), extensions.st_makepoint(-74.7760, 10.9640)), 4326)::extensions.geography, 120)::extensions.geometry,
   now(), now() + interval '7 days', 'operador');

-- Usuario de demo (respaldo de la demo y pruebas): demo@quillapass.test / QuillaPass-Demo-2026
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

commit;

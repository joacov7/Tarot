-- ============================================================================
-- seed.sql — Datos semilla del MVP
-- Roles, tiradas (one-card, three-card), planes con precios de EJEMPLO
-- (editables por el admin), prompt v1 y las 78 cartas.
-- ============================================================================

-- Roles
insert into public.roles (name, description) values
  ('client', 'Cliente que solicita lecturas'),
  ('reader', 'Tarotista que revisa y entrega'),
  ('admin',  'Administrador de la plataforma')
on conflict (name) do nothing;

-- Tiradas del MVP (con cartas) + lecturas con péndulo (sin cartas)
insert into public.tarot_spreads (slug, name, description, card_count, allows_reversed, uses_pendulum) values
  ('one-card',   'Una carta',   'Un mensaje breve y directo para el día o una pregunta puntual.', 1, true, false),
  ('three-card', 'Tres cartas', 'Pasado, presente y futuro (o situación, obstáculo y consejo).', 3, true, false),
  ('mesa-cuantica-infinity', 'Mesa Cuántica Infinity', 'Lectura con péndulo sobre la mesa cuántica infinity: explora tus energías, bloqueos y caminos posibles. La realiza la tarotista, sin selección de cartas.', 0, false, true),
  ('lovers', 'Lovers · Péndulo del amor', 'Lectura con péndulo enfocada en el amor y los vínculos: conexión, obstáculos y consejo para tu vida afectiva. La realiza la tarotista, sin selección de cartas.', 0, false, true)
on conflict (slug) do nothing;

-- Posiciones de "una carta"
insert into public.spread_positions (spread_id, position_index, label, meaning)
select s.id, 1, 'Mensaje', 'La energía central de la consulta.'
from public.tarot_spreads s where s.slug = 'one-card'
on conflict (spread_id, position_index) do nothing;

-- Posiciones de "tres cartas"
insert into public.spread_positions (spread_id, position_index, label, meaning)
select s.id, v.idx, v.label, v.meaning
from public.tarot_spreads s
cross join (values
  (1, 'Pasado',   'Lo que influye desde atrás.'),
  (2, 'Presente', 'La situación actual.'),
  (3, 'Futuro',   'La tendencia o el consejo.')
) as v(idx, label, meaning)
where s.slug = 'three-card'
on conflict (spread_id, position_index) do nothing;

-- Planes de servicio con PRECIOS DE EJEMPLO (el admin los edita luego)
insert into public.service_plans
  (slug, name, description, modality, price, currency, delivery_delay_seconds, priority, includes_audio, ai_model)
values
  ('express', 'Tarot Express', 'Lectura con prioridad y entrega rápida.', 'express', 3500.00, 'ARS', 3600,  10, false, 'gpt-4o-mini'),
  ('premium', 'Tarot Premium', 'Lectura personalizada con audio incluido.', 'premium', 7900.00, 'ARS', 86400, 0,  true,  'gpt-4o')
on conflict (slug) do nothing;

-- Prompt versión 1 (encuadre recreativo/reflexivo obligatorio)
insert into public.prompt_versions (version, system_prompt, model_default, is_active, params)
values (
  '1.0.0',
  'Sos un guía de tarot que redacta lecturas con tono cálido, reflexivo y natural. '
  'IMPORTANTE: no sos una persona real ni afirmás poseer poderes sobrenaturales. '
  'Presentás la lectura como una experiencia espiritual, recreativa y de reflexión, sin '
  'garantizar predicciones ni resultados. Evitá afirmaciones categóricas sobre salud, '
  'muerte, delitos o hechos inevitables. No brindes asesoramiento médico, legal ni financiero. '
  'Integrá la pregunta y el contexto del cliente, y mantené coherencia con cada carta, su '
  'posición y su orientación (derecha o invertida). Este texto es un BORRADOR para revisión humana.',
  'gpt-4o',
  true,
  '{"temperature": 0.8, "max_tokens": 1200}'::jsonb
)
on conflict (version) do nothing;

-- 78 cartas (22 mayores + 56 menores). Significados de base; el admin puede ampliarlos.
insert into public.tarot_cards
  (code, name, arcana, suit, number, keywords_upright, keywords_reversed, meaning_upright, meaning_reversed)
values
  ('major-00','El Loco','major',null,0,array['comienzos','inocencia','espontaneidad'],array['imprudencia','riesgo','ingenuidad'],'comienzos, inocencia, espontaneidad.','imprudencia, riesgo, ingenuidad.'),
  ('major-01','El Mago','major',null,1,array['manifestación','poder','recursos'],array['manipulación','dudas','talento sin usar'],'manifestación, poder, recursos.','manipulación, dudas, talento sin usar.'),
  ('major-02','La Sacerdotisa','major',null,2,array['intuición','misterio','interior'],array['secretos','desconexión','silencio'],'intuición, misterio, interior.','secretos, desconexión, silencio.'),
  ('major-03','La Emperatriz','major',null,3,array['abundancia','fertilidad','cuidado'],array['dependencia','bloqueo creativo','excesos'],'abundancia, fertilidad, cuidado.','dependencia, bloqueo creativo, excesos.'),
  ('major-04','El Emperador','major',null,4,array['estructura','autoridad','estabilidad'],array['rigidez','control','terquedad'],'estructura, autoridad, estabilidad.','rigidez, control, terquedad.'),
  ('major-05','El Sumo Sacerdote','major',null,5,array['tradición','guía','creencias'],array['rebeldía','dogma','ruptura'],'tradición, guía, creencias.','rebeldía, dogma, ruptura.'),
  ('major-06','Los Enamorados','major',null,6,array['unión','elección','valores'],array['desequilibrio','discordia','indecisión'],'unión, elección, valores.','desequilibrio, discordia, indecisión.'),
  ('major-07','El Carro','major',null,7,array['voluntad','avance','control'],array['dispersión','obstáculos','falta de rumbo'],'voluntad, avance, control.','dispersión, obstáculos, falta de rumbo.'),
  ('major-08','La Fuerza','major',null,8,array['coraje','paciencia','dominio interior'],array['inseguridad','impulsividad','agotamiento'],'coraje, paciencia, dominio interior.','inseguridad, impulsividad, agotamiento.'),
  ('major-09','El Ermitaño','major',null,9,array['introspección','búsqueda','sabiduría'],array['aislamiento','soledad','evasión'],'introspección, búsqueda, sabiduría.','aislamiento, soledad, evasión.'),
  ('major-10','La Rueda de la Fortuna','major',null,10,array['ciclos','destino','cambio'],array['resistencia','mala racha','estancamiento'],'ciclos, destino, cambio.','resistencia, mala racha, estancamiento.'),
  ('major-11','La Justicia','major',null,11,array['equilibrio','verdad','responsabilidad'],array['injusticia','deshonestidad','desbalance'],'equilibrio, verdad, responsabilidad.','injusticia, deshonestidad, desbalance.'),
  ('major-12','El Colgado','major',null,12,array['pausa','nueva perspectiva','entrega'],array['resistencia','estancamiento','sacrificio inútil'],'pausa, nueva perspectiva, entrega.','resistencia, estancamiento, sacrificio inútil.'),
  ('major-13','La Muerte','major',null,13,array['transformación','cierre','renacer'],array['resistencia al cambio','apego','transición lenta'],'transformación, cierre, renacer.','resistencia al cambio, apego, transición lenta.'),
  ('major-14','La Templanza','major',null,14,array['equilibrio','moderación','armonía'],array['excesos','desajuste','impaciencia'],'equilibrio, moderación, armonía.','excesos, desajuste, impaciencia.'),
  ('major-15','El Diablo','major',null,15,array['ataduras','deseo','materialismo'],array['liberación','ruptura de cadenas','conciencia'],'ataduras, deseo, materialismo.','liberación, ruptura de cadenas, conciencia.'),
  ('major-16','La Torre','major',null,16,array['ruptura','revelación','cambio súbito'],array['crisis evitada','miedo al cambio','demora'],'ruptura, revelación, cambio súbito.','crisis evitada, miedo al cambio, demora.'),
  ('major-17','La Estrella','major',null,17,array['esperanza','inspiración','sanación'],array['desánimo','desconexión','duda'],'esperanza, inspiración, sanación.','desánimo, desconexión, duda.'),
  ('major-18','La Luna','major',null,18,array['intuición','incertidumbre','sueños'],array['claridad','miedos disueltos','confusión que cede'],'intuición, incertidumbre, sueños.','claridad, miedos disueltos, confusión que cede.'),
  ('major-19','El Sol','major',null,19,array['alegría','éxito','vitalidad'],array['optimismo nublado','demora en el logro','cansancio'],'alegría, éxito, vitalidad.','optimismo nublado, demora en el logro, cansancio.'),
  ('major-20','El Juicio','major',null,20,array['renacimiento','llamado','balance'],array['autocrítica','dudas','postergación'],'renacimiento, llamado, balance.','autocrítica, dudas, postergación.'),
  ('major-21','El Mundo','major',null,21,array['plenitud','logro','integración'],array['cierre pendiente','falta de cierre','demora'],'plenitud, logro, integración.','cierre pendiente, falta de cierre, demora.'),
  ('cups-01','As de Copas','minor','cups',1,null,null,'As de Copas: energía de emociones y vínculos en su expresión favorable.','As de Copas invertida: desafíos o bloqueos en emociones y vínculos.'),
  ('cups-02','Dos de Copas','minor','cups',2,null,null,'Dos de Copas: energía de emociones y vínculos en su expresión favorable.','Dos de Copas invertida: desafíos o bloqueos en emociones y vínculos.'),
  ('cups-03','Tres de Copas','minor','cups',3,null,null,'Tres de Copas: energía de emociones y vínculos en su expresión favorable.','Tres de Copas invertida: desafíos o bloqueos en emociones y vínculos.'),
  ('cups-04','Cuatro de Copas','minor','cups',4,null,null,'Cuatro de Copas: energía de emociones y vínculos en su expresión favorable.','Cuatro de Copas invertida: desafíos o bloqueos en emociones y vínculos.'),
  ('cups-05','Cinco de Copas','minor','cups',5,null,null,'Cinco de Copas: energía de emociones y vínculos en su expresión favorable.','Cinco de Copas invertida: desafíos o bloqueos en emociones y vínculos.'),
  ('cups-06','Seis de Copas','minor','cups',6,null,null,'Seis de Copas: energía de emociones y vínculos en su expresión favorable.','Seis de Copas invertida: desafíos o bloqueos en emociones y vínculos.'),
  ('cups-07','Siete de Copas','minor','cups',7,null,null,'Siete de Copas: energía de emociones y vínculos en su expresión favorable.','Siete de Copas invertida: desafíos o bloqueos en emociones y vínculos.'),
  ('cups-08','Ocho de Copas','minor','cups',8,null,null,'Ocho de Copas: energía de emociones y vínculos en su expresión favorable.','Ocho de Copas invertida: desafíos o bloqueos en emociones y vínculos.'),
  ('cups-09','Nueve de Copas','minor','cups',9,null,null,'Nueve de Copas: energía de emociones y vínculos en su expresión favorable.','Nueve de Copas invertida: desafíos o bloqueos en emociones y vínculos.'),
  ('cups-10','Diez de Copas','minor','cups',10,null,null,'Diez de Copas: energía de emociones y vínculos en su expresión favorable.','Diez de Copas invertida: desafíos o bloqueos en emociones y vínculos.'),
  ('cups-11','Sota de Copas','minor','cups',11,null,null,'Sota de Copas: energía de emociones y vínculos en su expresión favorable.','Sota de Copas invertida: desafíos o bloqueos en emociones y vínculos.'),
  ('cups-12','Caballero de Copas','minor','cups',12,null,null,'Caballero de Copas: energía de emociones y vínculos en su expresión favorable.','Caballero de Copas invertida: desafíos o bloqueos en emociones y vínculos.'),
  ('cups-13','Reina de Copas','minor','cups',13,null,null,'Reina de Copas: energía de emociones y vínculos en su expresión favorable.','Reina de Copas invertida: desafíos o bloqueos en emociones y vínculos.'),
  ('cups-14','Rey de Copas','minor','cups',14,null,null,'Rey de Copas: energía de emociones y vínculos en su expresión favorable.','Rey de Copas invertida: desafíos o bloqueos en emociones y vínculos.'),
  ('wands-01','As de Bastos','minor','wands',1,null,null,'As de Bastos: energía de energía y proyectos en su expresión favorable.','As de Bastos invertida: desafíos o bloqueos en energía y proyectos.'),
  ('wands-02','Dos de Bastos','minor','wands',2,null,null,'Dos de Bastos: energía de energía y proyectos en su expresión favorable.','Dos de Bastos invertida: desafíos o bloqueos en energía y proyectos.'),
  ('wands-03','Tres de Bastos','minor','wands',3,null,null,'Tres de Bastos: energía de energía y proyectos en su expresión favorable.','Tres de Bastos invertida: desafíos o bloqueos en energía y proyectos.'),
  ('wands-04','Cuatro de Bastos','minor','wands',4,null,null,'Cuatro de Bastos: energía de energía y proyectos en su expresión favorable.','Cuatro de Bastos invertida: desafíos o bloqueos en energía y proyectos.'),
  ('wands-05','Cinco de Bastos','minor','wands',5,null,null,'Cinco de Bastos: energía de energía y proyectos en su expresión favorable.','Cinco de Bastos invertida: desafíos o bloqueos en energía y proyectos.'),
  ('wands-06','Seis de Bastos','minor','wands',6,null,null,'Seis de Bastos: energía de energía y proyectos en su expresión favorable.','Seis de Bastos invertida: desafíos o bloqueos en energía y proyectos.'),
  ('wands-07','Siete de Bastos','minor','wands',7,null,null,'Siete de Bastos: energía de energía y proyectos en su expresión favorable.','Siete de Bastos invertida: desafíos o bloqueos en energía y proyectos.'),
  ('wands-08','Ocho de Bastos','minor','wands',8,null,null,'Ocho de Bastos: energía de energía y proyectos en su expresión favorable.','Ocho de Bastos invertida: desafíos o bloqueos en energía y proyectos.'),
  ('wands-09','Nueve de Bastos','minor','wands',9,null,null,'Nueve de Bastos: energía de energía y proyectos en su expresión favorable.','Nueve de Bastos invertida: desafíos o bloqueos en energía y proyectos.'),
  ('wands-10','Diez de Bastos','minor','wands',10,null,null,'Diez de Bastos: energía de energía y proyectos en su expresión favorable.','Diez de Bastos invertida: desafíos o bloqueos en energía y proyectos.'),
  ('wands-11','Sota de Bastos','minor','wands',11,null,null,'Sota de Bastos: energía de energía y proyectos en su expresión favorable.','Sota de Bastos invertida: desafíos o bloqueos en energía y proyectos.'),
  ('wands-12','Caballero de Bastos','minor','wands',12,null,null,'Caballero de Bastos: energía de energía y proyectos en su expresión favorable.','Caballero de Bastos invertida: desafíos o bloqueos en energía y proyectos.'),
  ('wands-13','Reina de Bastos','minor','wands',13,null,null,'Reina de Bastos: energía de energía y proyectos en su expresión favorable.','Reina de Bastos invertida: desafíos o bloqueos en energía y proyectos.'),
  ('wands-14','Rey de Bastos','minor','wands',14,null,null,'Rey de Bastos: energía de energía y proyectos en su expresión favorable.','Rey de Bastos invertida: desafíos o bloqueos en energía y proyectos.'),
  ('swords-01','As de Espadas','minor','swords',1,null,null,'As de Espadas: energía de mente y decisiones en su expresión favorable.','As de Espadas invertida: desafíos o bloqueos en mente y decisiones.'),
  ('swords-02','Dos de Espadas','minor','swords',2,null,null,'Dos de Espadas: energía de mente y decisiones en su expresión favorable.','Dos de Espadas invertida: desafíos o bloqueos en mente y decisiones.'),
  ('swords-03','Tres de Espadas','minor','swords',3,null,null,'Tres de Espadas: energía de mente y decisiones en su expresión favorable.','Tres de Espadas invertida: desafíos o bloqueos en mente y decisiones.'),
  ('swords-04','Cuatro de Espadas','minor','swords',4,null,null,'Cuatro de Espadas: energía de mente y decisiones en su expresión favorable.','Cuatro de Espadas invertida: desafíos o bloqueos en mente y decisiones.'),
  ('swords-05','Cinco de Espadas','minor','swords',5,null,null,'Cinco de Espadas: energía de mente y decisiones en su expresión favorable.','Cinco de Espadas invertida: desafíos o bloqueos en mente y decisiones.'),
  ('swords-06','Seis de Espadas','minor','swords',6,null,null,'Seis de Espadas: energía de mente y decisiones en su expresión favorable.','Seis de Espadas invertida: desafíos o bloqueos en mente y decisiones.'),
  ('swords-07','Siete de Espadas','minor','swords',7,null,null,'Siete de Espadas: energía de mente y decisiones en su expresión favorable.','Siete de Espadas invertida: desafíos o bloqueos en mente y decisiones.'),
  ('swords-08','Ocho de Espadas','minor','swords',8,null,null,'Ocho de Espadas: energía de mente y decisiones en su expresión favorable.','Ocho de Espadas invertida: desafíos o bloqueos en mente y decisiones.'),
  ('swords-09','Nueve de Espadas','minor','swords',9,null,null,'Nueve de Espadas: energía de mente y decisiones en su expresión favorable.','Nueve de Espadas invertida: desafíos o bloqueos en mente y decisiones.'),
  ('swords-10','Diez de Espadas','minor','swords',10,null,null,'Diez de Espadas: energía de mente y decisiones en su expresión favorable.','Diez de Espadas invertida: desafíos o bloqueos en mente y decisiones.'),
  ('swords-11','Sota de Espadas','minor','swords',11,null,null,'Sota de Espadas: energía de mente y decisiones en su expresión favorable.','Sota de Espadas invertida: desafíos o bloqueos en mente y decisiones.'),
  ('swords-12','Caballero de Espadas','minor','swords',12,null,null,'Caballero de Espadas: energía de mente y decisiones en su expresión favorable.','Caballero de Espadas invertida: desafíos o bloqueos en mente y decisiones.'),
  ('swords-13','Reina de Espadas','minor','swords',13,null,null,'Reina de Espadas: energía de mente y decisiones en su expresión favorable.','Reina de Espadas invertida: desafíos o bloqueos en mente y decisiones.'),
  ('swords-14','Rey de Espadas','minor','swords',14,null,null,'Rey de Espadas: energía de mente y decisiones en su expresión favorable.','Rey de Espadas invertida: desafíos o bloqueos en mente y decisiones.'),
  ('pentacles-01','As de Oros','minor','pentacles',1,null,null,'As de Oros: energía de materia y recursos en su expresión favorable.','As de Oros invertida: desafíos o bloqueos en materia y recursos.'),
  ('pentacles-02','Dos de Oros','minor','pentacles',2,null,null,'Dos de Oros: energía de materia y recursos en su expresión favorable.','Dos de Oros invertida: desafíos o bloqueos en materia y recursos.'),
  ('pentacles-03','Tres de Oros','minor','pentacles',3,null,null,'Tres de Oros: energía de materia y recursos en su expresión favorable.','Tres de Oros invertida: desafíos o bloqueos en materia y recursos.'),
  ('pentacles-04','Cuatro de Oros','minor','pentacles',4,null,null,'Cuatro de Oros: energía de materia y recursos en su expresión favorable.','Cuatro de Oros invertida: desafíos o bloqueos en materia y recursos.'),
  ('pentacles-05','Cinco de Oros','minor','pentacles',5,null,null,'Cinco de Oros: energía de materia y recursos en su expresión favorable.','Cinco de Oros invertida: desafíos o bloqueos en materia y recursos.'),
  ('pentacles-06','Seis de Oros','minor','pentacles',6,null,null,'Seis de Oros: energía de materia y recursos en su expresión favorable.','Seis de Oros invertida: desafíos o bloqueos en materia y recursos.'),
  ('pentacles-07','Siete de Oros','minor','pentacles',7,null,null,'Siete de Oros: energía de materia y recursos en su expresión favorable.','Siete de Oros invertida: desafíos o bloqueos en materia y recursos.'),
  ('pentacles-08','Ocho de Oros','minor','pentacles',8,null,null,'Ocho de Oros: energía de materia y recursos en su expresión favorable.','Ocho de Oros invertida: desafíos o bloqueos en materia y recursos.'),
  ('pentacles-09','Nueve de Oros','minor','pentacles',9,null,null,'Nueve de Oros: energía de materia y recursos en su expresión favorable.','Nueve de Oros invertida: desafíos o bloqueos en materia y recursos.'),
  ('pentacles-10','Diez de Oros','minor','pentacles',10,null,null,'Diez de Oros: energía de materia y recursos en su expresión favorable.','Diez de Oros invertida: desafíos o bloqueos en materia y recursos.'),
  ('pentacles-11','Sota de Oros','minor','pentacles',11,null,null,'Sota de Oros: energía de materia y recursos en su expresión favorable.','Sota de Oros invertida: desafíos o bloqueos en materia y recursos.'),
  ('pentacles-12','Caballero de Oros','minor','pentacles',12,null,null,'Caballero de Oros: energía de materia y recursos en su expresión favorable.','Caballero de Oros invertida: desafíos o bloqueos en materia y recursos.'),
  ('pentacles-13','Reina de Oros','minor','pentacles',13,null,null,'Reina de Oros: energía de materia y recursos en su expresión favorable.','Reina de Oros invertida: desafíos o bloqueos en materia y recursos.'),
  ('pentacles-14','Rey de Oros','minor','pentacles',14,null,null,'Rey de Oros: energía de materia y recursos en su expresión favorable.','Rey de Oros invertida: desafíos o bloqueos en materia y recursos.')
on conflict (code) do nothing;

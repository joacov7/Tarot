// AUTO-GENERADO. Mazo canónico de 78 cartas para la UI de la mesa.
// Coincide con supabase/seed/seed.sql por `code`. Regenerar: scratchpad/gen_deck.mjs

import type { Orientation } from '@/types/domain';

export interface DeckCard {
  code: string;
  name: string;
  arcana: 'major' | 'minor';
  suit: 'cups' | 'wands' | 'swords' | 'pentacles' | null;
  number: number;
  uprightKeywords: string;
  reversedKeywords: string;
}

export function keywordsFor(card: DeckCard, orientation: Orientation): string {
  return orientation === 'reversed' ? card.reversedKeywords : card.uprightKeywords;
}

export const TAROT_DECK: readonly DeckCard[] = [
  { code: "major-00", name: "El Loco", arcana: 'major', suit: null, number: 0, uprightKeywords: "comienzos, inocencia, espontaneidad", reversedKeywords: "imprudencia, riesgo, ingenuidad" },
  { code: "major-01", name: "El Mago", arcana: 'major', suit: null, number: 1, uprightKeywords: "manifestación, poder, recursos", reversedKeywords: "manipulación, dudas, talento sin usar" },
  { code: "major-02", name: "La Sacerdotisa", arcana: 'major', suit: null, number: 2, uprightKeywords: "intuición, misterio, interior", reversedKeywords: "secretos, desconexión, silencio" },
  { code: "major-03", name: "La Emperatriz", arcana: 'major', suit: null, number: 3, uprightKeywords: "abundancia, fertilidad, cuidado", reversedKeywords: "dependencia, bloqueo creativo, excesos" },
  { code: "major-04", name: "El Emperador", arcana: 'major', suit: null, number: 4, uprightKeywords: "estructura, autoridad, estabilidad", reversedKeywords: "rigidez, control, terquedad" },
  { code: "major-05", name: "El Sumo Sacerdote", arcana: 'major', suit: null, number: 5, uprightKeywords: "tradición, guía, creencias", reversedKeywords: "rebeldía, dogma, ruptura" },
  { code: "major-06", name: "Los Enamorados", arcana: 'major', suit: null, number: 6, uprightKeywords: "unión, elección, valores", reversedKeywords: "desequilibrio, discordia, indecisión" },
  { code: "major-07", name: "El Carro", arcana: 'major', suit: null, number: 7, uprightKeywords: "voluntad, avance, control", reversedKeywords: "dispersión, obstáculos, falta de rumbo" },
  { code: "major-08", name: "La Fuerza", arcana: 'major', suit: null, number: 8, uprightKeywords: "coraje, paciencia, dominio interior", reversedKeywords: "inseguridad, impulsividad, agotamiento" },
  { code: "major-09", name: "El Ermitaño", arcana: 'major', suit: null, number: 9, uprightKeywords: "introspección, búsqueda, sabiduría", reversedKeywords: "aislamiento, soledad, evasión" },
  { code: "major-10", name: "La Rueda de la Fortuna", arcana: 'major', suit: null, number: 10, uprightKeywords: "ciclos, destino, cambio", reversedKeywords: "resistencia, mala racha, estancamiento" },
  { code: "major-11", name: "La Justicia", arcana: 'major', suit: null, number: 11, uprightKeywords: "equilibrio, verdad, responsabilidad", reversedKeywords: "injusticia, deshonestidad, desbalance" },
  { code: "major-12", name: "El Colgado", arcana: 'major', suit: null, number: 12, uprightKeywords: "pausa, nueva perspectiva, entrega", reversedKeywords: "resistencia, estancamiento, sacrificio inútil" },
  { code: "major-13", name: "La Muerte", arcana: 'major', suit: null, number: 13, uprightKeywords: "transformación, cierre, renacer", reversedKeywords: "resistencia al cambio, apego, transición lenta" },
  { code: "major-14", name: "La Templanza", arcana: 'major', suit: null, number: 14, uprightKeywords: "equilibrio, moderación, armonía", reversedKeywords: "excesos, desajuste, impaciencia" },
  { code: "major-15", name: "El Diablo", arcana: 'major', suit: null, number: 15, uprightKeywords: "ataduras, deseo, materialismo", reversedKeywords: "liberación, ruptura de cadenas, conciencia" },
  { code: "major-16", name: "La Torre", arcana: 'major', suit: null, number: 16, uprightKeywords: "ruptura, revelación, cambio súbito", reversedKeywords: "crisis evitada, miedo al cambio, demora" },
  { code: "major-17", name: "La Estrella", arcana: 'major', suit: null, number: 17, uprightKeywords: "esperanza, inspiración, sanación", reversedKeywords: "desánimo, desconexión, duda" },
  { code: "major-18", name: "La Luna", arcana: 'major', suit: null, number: 18, uprightKeywords: "intuición, incertidumbre, sueños", reversedKeywords: "claridad, miedos disueltos, confusión que cede" },
  { code: "major-19", name: "El Sol", arcana: 'major', suit: null, number: 19, uprightKeywords: "alegría, éxito, vitalidad", reversedKeywords: "optimismo nublado, demora en el logro, cansancio" },
  { code: "major-20", name: "El Juicio", arcana: 'major', suit: null, number: 20, uprightKeywords: "renacimiento, llamado, balance", reversedKeywords: "autocrítica, dudas, postergación" },
  { code: "major-21", name: "El Mundo", arcana: 'major', suit: null, number: 21, uprightKeywords: "plenitud, logro, integración", reversedKeywords: "cierre pendiente, falta de cierre, demora" },
  { code: "cups-01", name: "As de Copas", arcana: 'minor', suit: "cups", number: 1, uprightKeywords: "emociones y vínculos en expresión favorable", reversedKeywords: "bloqueos en emociones y vínculos" },
  { code: "cups-02", name: "Dos de Copas", arcana: 'minor', suit: "cups", number: 2, uprightKeywords: "emociones y vínculos en expresión favorable", reversedKeywords: "bloqueos en emociones y vínculos" },
  { code: "cups-03", name: "Tres de Copas", arcana: 'minor', suit: "cups", number: 3, uprightKeywords: "emociones y vínculos en expresión favorable", reversedKeywords: "bloqueos en emociones y vínculos" },
  { code: "cups-04", name: "Cuatro de Copas", arcana: 'minor', suit: "cups", number: 4, uprightKeywords: "emociones y vínculos en expresión favorable", reversedKeywords: "bloqueos en emociones y vínculos" },
  { code: "cups-05", name: "Cinco de Copas", arcana: 'minor', suit: "cups", number: 5, uprightKeywords: "emociones y vínculos en expresión favorable", reversedKeywords: "bloqueos en emociones y vínculos" },
  { code: "cups-06", name: "Seis de Copas", arcana: 'minor', suit: "cups", number: 6, uprightKeywords: "emociones y vínculos en expresión favorable", reversedKeywords: "bloqueos en emociones y vínculos" },
  { code: "cups-07", name: "Siete de Copas", arcana: 'minor', suit: "cups", number: 7, uprightKeywords: "emociones y vínculos en expresión favorable", reversedKeywords: "bloqueos en emociones y vínculos" },
  { code: "cups-08", name: "Ocho de Copas", arcana: 'minor', suit: "cups", number: 8, uprightKeywords: "emociones y vínculos en expresión favorable", reversedKeywords: "bloqueos en emociones y vínculos" },
  { code: "cups-09", name: "Nueve de Copas", arcana: 'minor', suit: "cups", number: 9, uprightKeywords: "emociones y vínculos en expresión favorable", reversedKeywords: "bloqueos en emociones y vínculos" },
  { code: "cups-10", name: "Diez de Copas", arcana: 'minor', suit: "cups", number: 10, uprightKeywords: "emociones y vínculos en expresión favorable", reversedKeywords: "bloqueos en emociones y vínculos" },
  { code: "cups-11", name: "Sota de Copas", arcana: 'minor', suit: "cups", number: 11, uprightKeywords: "emociones y vínculos en expresión favorable", reversedKeywords: "bloqueos en emociones y vínculos" },
  { code: "cups-12", name: "Caballero de Copas", arcana: 'minor', suit: "cups", number: 12, uprightKeywords: "emociones y vínculos en expresión favorable", reversedKeywords: "bloqueos en emociones y vínculos" },
  { code: "cups-13", name: "Reina de Copas", arcana: 'minor', suit: "cups", number: 13, uprightKeywords: "emociones y vínculos en expresión favorable", reversedKeywords: "bloqueos en emociones y vínculos" },
  { code: "cups-14", name: "Rey de Copas", arcana: 'minor', suit: "cups", number: 14, uprightKeywords: "emociones y vínculos en expresión favorable", reversedKeywords: "bloqueos en emociones y vínculos" },
  { code: "wands-01", name: "As de Bastos", arcana: 'minor', suit: "wands", number: 1, uprightKeywords: "energía y proyectos en expresión favorable", reversedKeywords: "bloqueos en energía y proyectos" },
  { code: "wands-02", name: "Dos de Bastos", arcana: 'minor', suit: "wands", number: 2, uprightKeywords: "energía y proyectos en expresión favorable", reversedKeywords: "bloqueos en energía y proyectos" },
  { code: "wands-03", name: "Tres de Bastos", arcana: 'minor', suit: "wands", number: 3, uprightKeywords: "energía y proyectos en expresión favorable", reversedKeywords: "bloqueos en energía y proyectos" },
  { code: "wands-04", name: "Cuatro de Bastos", arcana: 'minor', suit: "wands", number: 4, uprightKeywords: "energía y proyectos en expresión favorable", reversedKeywords: "bloqueos en energía y proyectos" },
  { code: "wands-05", name: "Cinco de Bastos", arcana: 'minor', suit: "wands", number: 5, uprightKeywords: "energía y proyectos en expresión favorable", reversedKeywords: "bloqueos en energía y proyectos" },
  { code: "wands-06", name: "Seis de Bastos", arcana: 'minor', suit: "wands", number: 6, uprightKeywords: "energía y proyectos en expresión favorable", reversedKeywords: "bloqueos en energía y proyectos" },
  { code: "wands-07", name: "Siete de Bastos", arcana: 'minor', suit: "wands", number: 7, uprightKeywords: "energía y proyectos en expresión favorable", reversedKeywords: "bloqueos en energía y proyectos" },
  { code: "wands-08", name: "Ocho de Bastos", arcana: 'minor', suit: "wands", number: 8, uprightKeywords: "energía y proyectos en expresión favorable", reversedKeywords: "bloqueos en energía y proyectos" },
  { code: "wands-09", name: "Nueve de Bastos", arcana: 'minor', suit: "wands", number: 9, uprightKeywords: "energía y proyectos en expresión favorable", reversedKeywords: "bloqueos en energía y proyectos" },
  { code: "wands-10", name: "Diez de Bastos", arcana: 'minor', suit: "wands", number: 10, uprightKeywords: "energía y proyectos en expresión favorable", reversedKeywords: "bloqueos en energía y proyectos" },
  { code: "wands-11", name: "Sota de Bastos", arcana: 'minor', suit: "wands", number: 11, uprightKeywords: "energía y proyectos en expresión favorable", reversedKeywords: "bloqueos en energía y proyectos" },
  { code: "wands-12", name: "Caballero de Bastos", arcana: 'minor', suit: "wands", number: 12, uprightKeywords: "energía y proyectos en expresión favorable", reversedKeywords: "bloqueos en energía y proyectos" },
  { code: "wands-13", name: "Reina de Bastos", arcana: 'minor', suit: "wands", number: 13, uprightKeywords: "energía y proyectos en expresión favorable", reversedKeywords: "bloqueos en energía y proyectos" },
  { code: "wands-14", name: "Rey de Bastos", arcana: 'minor', suit: "wands", number: 14, uprightKeywords: "energía y proyectos en expresión favorable", reversedKeywords: "bloqueos en energía y proyectos" },
  { code: "swords-01", name: "As de Espadas", arcana: 'minor', suit: "swords", number: 1, uprightKeywords: "mente y decisiones en expresión favorable", reversedKeywords: "bloqueos en mente y decisiones" },
  { code: "swords-02", name: "Dos de Espadas", arcana: 'minor', suit: "swords", number: 2, uprightKeywords: "mente y decisiones en expresión favorable", reversedKeywords: "bloqueos en mente y decisiones" },
  { code: "swords-03", name: "Tres de Espadas", arcana: 'minor', suit: "swords", number: 3, uprightKeywords: "mente y decisiones en expresión favorable", reversedKeywords: "bloqueos en mente y decisiones" },
  { code: "swords-04", name: "Cuatro de Espadas", arcana: 'minor', suit: "swords", number: 4, uprightKeywords: "mente y decisiones en expresión favorable", reversedKeywords: "bloqueos en mente y decisiones" },
  { code: "swords-05", name: "Cinco de Espadas", arcana: 'minor', suit: "swords", number: 5, uprightKeywords: "mente y decisiones en expresión favorable", reversedKeywords: "bloqueos en mente y decisiones" },
  { code: "swords-06", name: "Seis de Espadas", arcana: 'minor', suit: "swords", number: 6, uprightKeywords: "mente y decisiones en expresión favorable", reversedKeywords: "bloqueos en mente y decisiones" },
  { code: "swords-07", name: "Siete de Espadas", arcana: 'minor', suit: "swords", number: 7, uprightKeywords: "mente y decisiones en expresión favorable", reversedKeywords: "bloqueos en mente y decisiones" },
  { code: "swords-08", name: "Ocho de Espadas", arcana: 'minor', suit: "swords", number: 8, uprightKeywords: "mente y decisiones en expresión favorable", reversedKeywords: "bloqueos en mente y decisiones" },
  { code: "swords-09", name: "Nueve de Espadas", arcana: 'minor', suit: "swords", number: 9, uprightKeywords: "mente y decisiones en expresión favorable", reversedKeywords: "bloqueos en mente y decisiones" },
  { code: "swords-10", name: "Diez de Espadas", arcana: 'minor', suit: "swords", number: 10, uprightKeywords: "mente y decisiones en expresión favorable", reversedKeywords: "bloqueos en mente y decisiones" },
  { code: "swords-11", name: "Sota de Espadas", arcana: 'minor', suit: "swords", number: 11, uprightKeywords: "mente y decisiones en expresión favorable", reversedKeywords: "bloqueos en mente y decisiones" },
  { code: "swords-12", name: "Caballero de Espadas", arcana: 'minor', suit: "swords", number: 12, uprightKeywords: "mente y decisiones en expresión favorable", reversedKeywords: "bloqueos en mente y decisiones" },
  { code: "swords-13", name: "Reina de Espadas", arcana: 'minor', suit: "swords", number: 13, uprightKeywords: "mente y decisiones en expresión favorable", reversedKeywords: "bloqueos en mente y decisiones" },
  { code: "swords-14", name: "Rey de Espadas", arcana: 'minor', suit: "swords", number: 14, uprightKeywords: "mente y decisiones en expresión favorable", reversedKeywords: "bloqueos en mente y decisiones" },
  { code: "pentacles-01", name: "As de Oros", arcana: 'minor', suit: "pentacles", number: 1, uprightKeywords: "materia y recursos en expresión favorable", reversedKeywords: "bloqueos en materia y recursos" },
  { code: "pentacles-02", name: "Dos de Oros", arcana: 'minor', suit: "pentacles", number: 2, uprightKeywords: "materia y recursos en expresión favorable", reversedKeywords: "bloqueos en materia y recursos" },
  { code: "pentacles-03", name: "Tres de Oros", arcana: 'minor', suit: "pentacles", number: 3, uprightKeywords: "materia y recursos en expresión favorable", reversedKeywords: "bloqueos en materia y recursos" },
  { code: "pentacles-04", name: "Cuatro de Oros", arcana: 'minor', suit: "pentacles", number: 4, uprightKeywords: "materia y recursos en expresión favorable", reversedKeywords: "bloqueos en materia y recursos" },
  { code: "pentacles-05", name: "Cinco de Oros", arcana: 'minor', suit: "pentacles", number: 5, uprightKeywords: "materia y recursos en expresión favorable", reversedKeywords: "bloqueos en materia y recursos" },
  { code: "pentacles-06", name: "Seis de Oros", arcana: 'minor', suit: "pentacles", number: 6, uprightKeywords: "materia y recursos en expresión favorable", reversedKeywords: "bloqueos en materia y recursos" },
  { code: "pentacles-07", name: "Siete de Oros", arcana: 'minor', suit: "pentacles", number: 7, uprightKeywords: "materia y recursos en expresión favorable", reversedKeywords: "bloqueos en materia y recursos" },
  { code: "pentacles-08", name: "Ocho de Oros", arcana: 'minor', suit: "pentacles", number: 8, uprightKeywords: "materia y recursos en expresión favorable", reversedKeywords: "bloqueos en materia y recursos" },
  { code: "pentacles-09", name: "Nueve de Oros", arcana: 'minor', suit: "pentacles", number: 9, uprightKeywords: "materia y recursos en expresión favorable", reversedKeywords: "bloqueos en materia y recursos" },
  { code: "pentacles-10", name: "Diez de Oros", arcana: 'minor', suit: "pentacles", number: 10, uprightKeywords: "materia y recursos en expresión favorable", reversedKeywords: "bloqueos en materia y recursos" },
  { code: "pentacles-11", name: "Sota de Oros", arcana: 'minor', suit: "pentacles", number: 11, uprightKeywords: "materia y recursos en expresión favorable", reversedKeywords: "bloqueos en materia y recursos" },
  { code: "pentacles-12", name: "Caballero de Oros", arcana: 'minor', suit: "pentacles", number: 12, uprightKeywords: "materia y recursos en expresión favorable", reversedKeywords: "bloqueos en materia y recursos" },
  { code: "pentacles-13", name: "Reina de Oros", arcana: 'minor', suit: "pentacles", number: 13, uprightKeywords: "materia y recursos en expresión favorable", reversedKeywords: "bloqueos en materia y recursos" },
  { code: "pentacles-14", name: "Rey de Oros", arcana: 'minor', suit: "pentacles", number: 14, uprightKeywords: "materia y recursos en expresión favorable", reversedKeywords: "bloqueos en materia y recursos" },
];

export const DECK_SIZE = TAROT_DECK.length; // 78

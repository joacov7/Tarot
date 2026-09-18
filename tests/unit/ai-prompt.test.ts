import { describe, it, expect } from 'vitest';
import { buildUserPrompt, formatCardsBlock } from '@/server/services/ai/prompt';
import type { GenerateReadingInput } from '@/server/services/ai/provider';

const cards: GenerateReadingInput['cards'] = [
  { name: 'El Sol', positionLabel: 'Presente', orientation: 'upright', meaning: 'alegría, éxito' },
  { name: 'La Torre', positionLabel: 'Futuro', orientation: 'reversed', meaning: 'crisis evitada' },
];

const input: GenerateReadingInput = {
  question: '¿Cómo sigo con mi proyecto?',
  context: 'Estoy por lanzar algo nuevo.',
  spreadName: 'Tres cartas',
  cards,
  systemPrompt: 'SYSTEM',
  model: 'gpt-4o',
};

describe('formatCardsBlock', () => {
  it('numera cada carta con posición, orientación y significado', () => {
    const block = formatCardsBlock(cards);
    expect(block).toContain('1. Posición "Presente": El Sol (derecha)');
    expect(block).toContain('2. Posición "Futuro": La Torre (invertida)');
    expect(block).toContain('alegría, éxito');
  });
});

describe('buildUserPrompt', () => {
  it('integra pregunta, contexto y cartas', () => {
    const p = buildUserPrompt(input);
    expect(p).toContain('Tirada: Tres cartas.');
    expect(p).toContain('¿Cómo sigo con mi proyecto?');
    expect(p).toContain('Estoy por lanzar algo nuevo.');
    expect(p).toContain('El Sol (derecha)');
    expect(p).toContain('BORRADOR');
  });

  it('omite el bloque de contexto cuando no hay', () => {
    const p = buildUserPrompt({ ...input, context: undefined });
    expect(p).not.toContain('Contexto adicional');
  });

  it('lectura con péndulo (0 cartas): usa el encuadre de péndulo, sin cartas', () => {
    const p = buildUserPrompt({ ...input, cards: [], spreadName: 'Mesa Cuántica Infinity' });
    expect(p).toContain('lectura con péndulo');
    expect(p).not.toContain('Cartas seleccionadas');
    expect(p).toContain('BORRADOR');
  });
});

import type { GenerateReadingInput } from '@/server/services/ai/provider';

/**
 * Armado del prompt del usuario a partir de las cartas + pregunta + contexto.
 * Función PURA y testeable. El System Prompt es versionado (viene de
 * `prompt_versions`) y se pasa aparte.
 */

export function formatCardsBlock(cards: GenerateReadingInput['cards']): string {
  return cards
    .map((c, i) => {
      const orient = c.orientation === 'reversed' ? 'invertida' : 'derecha';
      return `${i + 1}. Posición "${c.positionLabel}": ${c.name} (${orient}). Significado base: ${c.meaning}`;
    })
    .join('\n');
}

export function buildUserPrompt(input: GenerateReadingInput): string {
  const parts: string[] = [];
  parts.push(`Tirada: ${input.spreadName}.`);
  parts.push(`Pregunta del consultante: "${input.question}".`);
  if (input.context && input.context.trim().length > 0) {
    parts.push(`Contexto adicional: ${input.context.trim()}`);
  }
  parts.push('');
  parts.push('Cartas seleccionadas (en orden de posición):');
  parts.push(formatCardsBlock(input.cards));
  parts.push('');
  parts.push(
    'Redactá una lectura cálida y reflexiva que integre la pregunta y el contexto, ' +
      'manteniendo continuidad entre las cartas y respetando su orientación. ' +
      'Recordá el encuadre: experiencia recreativa y de reflexión, sin garantías ni ' +
      'afirmaciones categóricas. Este es un BORRADOR para revisión humana.',
  );
  return parts.join('\n');
}

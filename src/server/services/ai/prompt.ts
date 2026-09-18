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

  const isPendulum = input.cards.length === 0;
  if (isPendulum) {
    // Lectura con péndulo: no hay cartas. La IA prepara un borrador reflexivo de
    // apoyo; la lectura definitiva la realiza la tarotista con el péndulo.
    parts.push(
      'Esta es una lectura con péndulo (sin cartas). Redactá un borrador cálido y reflexivo ' +
        'que acompañe la consulta: explorá posibles energías, preguntas para la reflexión y ' +
        'un mensaje de contención, dejando espacio para que la tarotista complete la lectura ' +
        'con el péndulo. No inventes resultados del péndulo ni afirmes respuestas cerradas.',
    );
  } else {
    parts.push('Cartas seleccionadas (en orden de posición):');
    parts.push(formatCardsBlock(input.cards));
    parts.push('');
    parts.push(
      'Redactá una lectura cálida y reflexiva que integre la pregunta y el contexto, ' +
        'manteniendo continuidad entre las cartas y respetando su orientación.',
    );
  }

  parts.push('');
  parts.push(
    'Recordá el encuadre: experiencia recreativa y de reflexión, sin garantías ni ' +
      'afirmaciones categóricas. Este es un BORRADOR para revisión humana.',
  );
  return parts.join('\n');
}

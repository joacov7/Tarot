import 'server-only';

import OpenAI from 'openai';
import type {
  AiProvider,
  GenerateReadingInput,
  GenerateReadingResult,
} from '@/server/services/ai/provider';
import { buildUserPrompt } from '@/server/services/ai/prompt';

/**
 * Proveedor de IA con OpenAI. Implementa AiProvider (abstracción intercambiable).
 * Registra el modelo efectivo y los tokens para trazabilidad/costo.
 */
export class OpenAiProvider implements AiProvider {
  readonly name = 'openai';

  private client(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY no configurado');
    return new OpenAI({ apiKey });
  }

  async generateReading(input: GenerateReadingInput): Promise<GenerateReadingResult> {
    const client = this.client();
    const temperature =
      typeof input.params?.temperature === 'number' ? input.params.temperature : 0.8;
    const maxTokens =
      typeof input.params?.max_tokens === 'number' ? input.params.max_tokens : 1200;

    const completion = await client.chat.completions.create({
      model: input.model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: buildUserPrompt(input) },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim() ?? '';
    if (!content) throw new Error('OpenAI no devolvió contenido');

    return {
      content,
      model: completion.model ?? input.model,
      tokensInput: completion.usage?.prompt_tokens,
      tokensOutput: completion.usage?.completion_tokens,
    };
  }
}

export const openAiProvider = new OpenAiProvider();

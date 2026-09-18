import type { Orientation } from '@/types/domain';

/**
 * Contrato del proveedor de IA. La implementación (OpenAI) llega en la Fase 4.
 * Esta abstracción evita lock-in y permite failover / cambio por config.
 */

export interface AiCardContext {
  name: string;
  positionLabel: string;
  orientation: Orientation;
  meaning: string;
}

export interface GenerateReadingInput {
  question: string;
  context?: string;
  spreadName: string;
  cards: AiCardContext[];
  systemPrompt: string;
  model: string;
  params?: Record<string, unknown>;
}

export interface GenerateReadingResult {
  content: string;
  model: string;
  tokensInput?: number;
  tokensOutput?: number;
}

export interface AiProvider {
  readonly name: string;
  generateReading(input: GenerateReadingInput): Promise<GenerateReadingResult>;
}

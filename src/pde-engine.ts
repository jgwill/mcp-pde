/**
 * PDE Engine v2
 * 
 * LLM-driven Prompt Decomposition Engine.
 * Uses system prompts (from IAIP/lib/pde lineage) to instruct an LLM to produce
 * structured DecompositionResult JSON, then parses and stores the result.
 * 
 * The LLM call itself is NOT embedded here — the MCP tool receives the prompt,
 * builds the system prompt, and the calling agent (Copilot, Gemini, mia-code)
 * feeds it to their LLM. The engine then parses the LLM response.
 * 
 * For direct decomposition without external LLM, use decomposeWithResponse()
 * after getting the LLM response yourself.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  type DecompositionResult,
  type DecompositionOptions,
  type StoredDecomposition,
  DEFAULT_OPTIONS,
} from './types.js';
import { buildSystemPrompt, formatUserMessage } from './prompts.js';
import { parseDecompositionResponse, PDEParseError } from './parser.js';
import { saveDecomposition, loadDecomposition, listDecompositions, decompositionToMarkdown } from './storage.js';

export class PdeEngine {
  private defaultWorkdir: string;

  constructor(workdir?: string) {
    this.defaultWorkdir = workdir || process.cwd();
  }

  /**
   * Build the system prompt + user message for the calling LLM.
   * The caller sends these to their LLM provider, then calls parseAndStore() with the response.
   */
  buildPrompt(
    prompt: string,
    options?: Partial<DecompositionOptions>
  ): { systemPrompt: string; userMessage: string } {
    const opts: DecompositionOptions = { ...DEFAULT_OPTIONS, ...options };
    return {
      systemPrompt: buildSystemPrompt(opts),
      userMessage: formatUserMessage(prompt),
    };
  }

  /**
   * Parse an LLM response text into DecompositionResult and persist it.
   */
  parseAndStore(
    llmResponse: string,
    originalPrompt: string,
    options?: Partial<DecompositionOptions>,
    workdir?: string
  ): StoredDecomposition {
    const opts: DecompositionOptions = { ...DEFAULT_OPTIONS, ...options };
    const result = parseDecompositionResponse(llmResponse);
    const id = uuidv4();
    const dir = workdir || this.defaultWorkdir;
    return saveDecomposition(dir, id, originalPrompt, result, opts);
  }

  /**
   * Parse an LLM response text into DecompositionResult without storing.
   */
  parse(llmResponse: string): DecompositionResult {
    return parseDecompositionResponse(llmResponse);
  }

  /**
   * Get a stored decomposition by ID.
   */
  get(id: string, workdir?: string): StoredDecomposition | null {
    return loadDecomposition(workdir || this.defaultWorkdir, id);
  }

  /**
   * List stored decompositions.
   */
  list(workdir?: string, limit?: number): StoredDecomposition[] {
    return listDecompositions(workdir || this.defaultWorkdir, limit);
  }

  /**
   * Export a decomposition to markdown.
   */
  exportMarkdown(id: string, workdir?: string): string | null {
    const stored = this.get(id, workdir);
    if (!stored) return null;
    return decompositionToMarkdown(stored.result, stored.prompt);
  }
}

export { PDEParseError };


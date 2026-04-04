#!/usr/bin/env node
/**
 * mcp-pde CLI — Full PDE pipeline from terminal
 *
 * Commands:
 *   decompose <text>       Decompose a prompt via LLM (Anthropic Claude)
 *   parse <file>           Parse a raw LLM response file into PDE
 *   build-prompt <text>    Output system+user prompt (for piping to other LLMs)
 *   list                   List stored decompositions
 *   get <id>               Show a stored decomposition
 *   export <id>            Export decomposition as markdown
 *   serve                  Start MCP server (original behavior)
 *
 * The decompose command calls Claude directly, parses the response,
 * saves to .pde/, and outputs the result — full end-to-end.
 */

import minimist from 'minimist';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { PdeEngine } from './pde-engine.js';
import { buildSystemPrompt, formatUserMessage } from './prompts.js';
import { DEFAULT_OPTIONS, type DecompositionOptions } from './types.js';
import { startServer } from './mcp-server.js';

const HELP = `
🧠 mcp-pde — Prompt Decomposition Engine CLI

USAGE:
  mcp-pde <command> [options]

COMMANDS:
  decompose <text|->     Decompose prompt via Claude API (full end-to-end)
  parse <file>           Parse raw LLM response JSON into PDE & store
  build-prompt <text>    Output system+user prompt pair (for piping)
  list                   List stored decompositions in .pde/
  get <id>               Show a stored decomposition by ID
  export <id>            Export decomposition as markdown
  serve                  Start MCP server (stdio transport)

OPTIONS:
  --workdir, -w <path>   Working directory for .pde/ storage (default: cwd)
  --model, -m <model>    Claude model (default: claude-sonnet-4-20250514)
  --parent, -p <uuid>    Parent PDE UUID for parent-child nesting
  --no-implicit          Don't extract implicit intents
  --no-deps              Don't map dependencies
  --json                 Output raw JSON instead of formatted
  --limit, -l <n>        Limit for list command (default: 10)
  --file, -f <path>      Read prompt from file instead of argument
  --help, -h             Show this help

ENVIRONMENT:
  ANTHROPIC_API_KEY      Required for 'decompose' command
  PDE_MODEL              Default model override
  PDE_WORKDIR            Default working directory

EXAMPLES:
  # Full decompose — calls Claude, parses, stores, outputs
  mcp-pde decompose "Build a CLI for mcp-pde that calls Claude directly"

  # Decompose from file
  mcp-pde decompose -f ./my-prompt.txt

  # Decompose from stdin
  echo "complex prompt here" | mcp-pde decompose -

  # Just build the prompt (pipe to your own LLM)
  mcp-pde build-prompt "my prompt" --json | jq .systemPrompt

  # Parse a saved LLM response
  mcp-pde parse ./llm-response.txt --prompt "original prompt"

  # List & explore
  mcp-pde list
  mcp-pde get <uuid>
  mcp-pde export <uuid>

PIPELINE:
  mcp-pde decompose → coaia-pde import <id> → cnarrative ls -M <chart.jsonl>
`;

// ── Anthropic LLM call ──────────────────────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  model: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not set. Required for decompose command.');
    console.error('   Set it: export ANTHROPIC_API_KEY=sk-ant-...');
    process.exit(1);
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }
  return textBlock.text;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function readPromptInput(argv: minimist.ParsedArgs): string {
  // From --file / -f
  if (argv.file || argv.f) {
    const filePath = resolve(argv.file || argv.f);
    if (!existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }
    return readFileSync(filePath, 'utf-8').trim();
  }

  // From positional arg (or stdin via "-")
  const text = argv._.slice(1).join(' ');
  if (text === '-' || text === '') {
    // Read from stdin
    return readFileSync(0, 'utf-8').trim();
  }

  return text;
}

function getOptions(argv: minimist.ParsedArgs): Partial<DecompositionOptions> {
  const opts: Partial<DecompositionOptions> = {};
  if (argv['no-implicit']) opts.extractImplicit = false;
  if (argv['no-deps']) opts.mapDependencies = false;
  return opts;
}

function formatDecomposition(stored: any, json: boolean): string {
  if (json) return JSON.stringify(stored, null, 2);

  const r = stored.result;
  const lines: string[] = [];

  lines.push(`\n🧠 PDE Decomposition: ${stored.id}`);
  lines.push(`📅 ${stored.timestamp}\n`);

  // Primary
  lines.push(`🎯 PRIMARY: ${r.primary.action} → ${r.primary.target}`);
  lines.push(`   Urgency: ${r.primary.urgency} | Confidence: ${Math.round(r.primary.confidence * 100)}%\n`);

  // Secondary
  if (r.secondary.length > 0) {
    lines.push(`📋 SECONDARY INTENTS (${r.secondary.length}):`);
    for (const s of r.secondary) {
      const tag = s.implicit ? ' (implicit)' : '';
      lines.push(`   • ${s.action} → ${s.target}${tag}`);
    }
    lines.push('');
  }

  // Four Directions
  const dirEmoji: Record<string, string> = { east: '🌅', south: '🔥', west: '🌊', north: '❄️' };
  const dirName: Record<string, string> = { east: 'VISION', south: 'ANALYSIS', west: 'VALIDATION', north: 'ACTION' };
  for (const dir of ['east', 'south', 'west', 'north']) {
    const items = r.directions[dir];
    if (items && items.length > 0) {
      lines.push(`${dirEmoji[dir]} ${dir.toUpperCase()} — ${dirName[dir]}:`);
      for (const item of items) {
        lines.push(`   • ${item.text} [${Math.round(item.confidence * 100)}%]`);
      }
      lines.push('');
    }
  }

  // Action Stack
  if (r.actionStack.length > 0) {
    lines.push(`⚡ ACTION STACK (${r.actionStack.length}):`);
    for (const a of r.actionStack) {
      const check = a.completed ? '✅' : '⬜';
      const dep = a.dependency ? ` (→ ${a.dependency})` : '';
      lines.push(`   ${check} [${dirEmoji[a.direction] || '?'}] ${a.text}${dep}`);
    }
    lines.push('');
  }

  // Ambiguities
  if (r.ambiguities.length > 0) {
    lines.push(`⚠️  AMBIGUITIES (${r.ambiguities.length}):`);
    for (const a of r.ambiguities) {
      lines.push(`   ❓ "${a.text}"`);
      lines.push(`      → ${a.suggestion}`);
    }
    lines.push('');
  }

  // Context
  const ctx = r.context;
  if (ctx.files_needed.length || ctx.tools_required.length || ctx.assumptions.length) {
    lines.push('📦 CONTEXT:');
    if (ctx.files_needed.length) lines.push(`   Files: ${ctx.files_needed.join(', ')}`);
    if (ctx.tools_required.length) lines.push(`   Tools: ${ctx.tools_required.join(', ')}`);
    if (ctx.assumptions.length) {
      lines.push('   Assumptions:');
      for (const a of ctx.assumptions) lines.push(`     • ${a}`);
    }
    lines.push('');
  }

  // Outputs
  const out = r.outputs;
  if (out.artifacts.length || out.updates.length || out.communications.length) {
    lines.push('📤 EXPECTED OUTPUTS:');
    if (out.artifacts.length) lines.push(`   Artifacts: ${out.artifacts.join(', ')}`);
    if (out.updates.length) lines.push(`   Updates: ${out.updates.join(', ')}`);
    if (out.communications.length) lines.push(`   Comms: ${out.communications.join(', ')}`);
    lines.push('');
  }

  return lines.join('\n');
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const argv = minimist(process.argv.slice(2), {
    alias: { h: 'help', w: 'workdir', m: 'model', l: 'limit', f: 'file', p: 'parent' },
    boolean: ['help', 'json', 'no-implicit', 'no-deps'],
    string: ['workdir', 'model', 'file', 'prompt', 'parent'],
  });

  if (argv.help || argv._.length === 0) {
    console.log(HELP);
    process.exit(0);
  }

  const command = argv._[0];
  const workdir = argv.workdir || process.env.PDE_WORKDIR || process.cwd();
  const model = argv.model || process.env.PDE_MODEL || 'claude-sonnet-4-20250514';
  const engine = new PdeEngine(workdir);
  const opts = getOptions(argv);

  try {
    switch (command) {

      // ── decompose: full end-to-end ──────────────────────────────────────
      case 'decompose':
      case 'd': {
        const prompt = readPromptInput(argv);
        if (!prompt) {
          console.error('❌ No prompt provided. Pass text, use -f <file>, or pipe via stdin.');
          process.exit(1);
        }

        const fullOpts = { ...DEFAULT_OPTIONS, ...opts };
        const { systemPrompt, userMessage } = engine.buildPrompt(prompt, opts);
        const parentPdeId: string | undefined = argv.parent || undefined;

        console.error(`🧠 Decomposing with ${model}...`);
        console.error(`📁 Storing in ${resolve(workdir, '.pde/')}`);
        if (parentPdeId) console.error(`🔗 Parent PDE: ${parentPdeId}`);

        const llmResponse = await callClaude(systemPrompt, userMessage, model);
        const stored = engine.parseAndStore(llmResponse, prompt, opts, workdir, parentPdeId);

        console.error(`✅ Stored: ${stored.id}`);
        if (stored.folder_name) {
          console.error(`📂 Folder: ${stored.folder_name}`);
        }

        console.log(formatDecomposition(stored, !!argv.json));

        // Print pipeline hint
        console.error(`\n🧭 Next: coaia-pde import ${stored.id} -w ${workdir}`);
        break;
      }

      // ── parse: parse raw LLM response file ─────────────────────────────
      case 'parse':
      case 'p': {
        const filePath = argv._[1];
        if (!filePath) {
          console.error('❌ Usage: mcp-pde parse <response-file> --prompt "original prompt"');
          process.exit(1);
        }
        const responseText = readFileSync(resolve(filePath), 'utf-8');
        const originalPrompt = argv.prompt || '(prompt not provided)';
        const parentPdeId: string | undefined = argv.parent || undefined;
        const stored = engine.parseAndStore(responseText, originalPrompt, opts, workdir, parentPdeId);

        console.error(`✅ Parsed & stored: ${stored.id}`);
        console.log(formatDecomposition(stored, !!argv.json));
        console.error(`\n🧭 Next: coaia-pde import ${stored.id} -w ${workdir}`);
        break;
      }

      // ── build-prompt: output prompt pair ────────────────────────────────
      case 'build-prompt':
      case 'bp': {
        const prompt = readPromptInput(argv);
        if (!prompt) {
          console.error('❌ No prompt provided.');
          process.exit(1);
        }
        const { systemPrompt, userMessage } = engine.buildPrompt(prompt, opts);

        if (argv.json) {
          console.log(JSON.stringify({ systemPrompt, userMessage, originalPrompt: prompt }, null, 2));
        } else {
          console.log('=== SYSTEM PROMPT ===');
          console.log(systemPrompt);
          console.log('\n=== USER MESSAGE ===');
          console.log(userMessage);
        }
        break;
      }

      // ── list ────────────────────────────────────────────────────────────
      case 'list':
      case 'ls': {
        const limit = argv.limit || 10;
        const parentId: string | undefined = argv.parent || undefined;
        const items = parentId
          ? engine.listChildren(parentId, workdir)
          : engine.list(workdir, limit);
        if (items.length === 0) {
          console.log(parentId
            ? `No children found for parent ${parentId} in ${resolve(workdir, '.pde/')}`
            : `No decompositions found in ${resolve(workdir, '.pde/')}`);
          break;
        }

        if (argv.json) {
          const summary = items.map(d => ({
            id: d.id,
            timestamp: d.timestamp,
            primary: `${d.result.primary.action} → ${d.result.primary.target}`,
            secondary: d.result.secondary.length,
            ambiguities: d.result.ambiguities.length,
            actions: d.result.actionStack.length,
          }));
          console.log(JSON.stringify(summary, null, 2));
        } else {
          console.log(`\n📂 Decompositions in ${resolve(workdir, '.pde/')} (${items.length}):\n`);
          for (const d of items) {
            const date = new Date(d.timestamp).toLocaleString();
            console.log(`  🔹 ${d.id}`);
            console.log(`     ${date} | 🎯 ${d.result.primary.action} → ${d.result.primary.target}`);
            console.log(`     ${d.result.secondary.length} secondary | ${d.result.actionStack.length} actions | ${d.result.ambiguities.length} ambiguities`);
            console.log('');
          }
        }
        break;
      }

      // ── get ─────────────────────────────────────────────────────────────
      case 'get':
      case 'g': {
        const id = argv._[1];
        if (!id) {
          console.error('❌ Usage: mcp-pde get <id>');
          process.exit(1);
        }
        const stored = engine.get(id, workdir);
        if (!stored) {
          console.error(`❌ Decomposition ${id} not found in ${resolve(workdir, '.pde/')}`);
          process.exit(1);
        }
        console.log(formatDecomposition(stored, !!argv.json));
        break;
      }

      // ── export ──────────────────────────────────────────────────────────
      case 'export':
      case 'exp': {
        const id = argv._[1];
        if (!id) {
          console.error('❌ Usage: mcp-pde export <id>');
          process.exit(1);
        }
        const md = engine.exportMarkdown(id, workdir);
        if (!md) {
          console.error(`❌ Decomposition ${id} not found`);
          process.exit(1);
        }
        console.log(md);
        break;
      }

      // ── serve (original MCP behavior) ───────────────────────────────────
      case 'serve':
      case 'mcp': {
        await startServer();
        break;
      }

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log(HELP);
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();

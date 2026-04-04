# PDE Parent-Child Schema & Folder-Based Output
> EAST Phase Design — parent_pde_uuid feature for mcp-pde v2.1
> Issue: jgwill/src#421 | Related: #418, #419

**Version**: 2.1.0-design
**Document ID**: pde-parent-child-schema-v2.1

## Creative Intent

### Desired Outcome
PDEs form **parent-child hierarchies** stored in timestamped folders, enabling multi-level decomposition (mission → sub-missions), traceable lineage, and human-navigable `.pde/` layouts.

### Current Reality
- Storage: flat `.pde/<uuid>.json` + `.pde/<uuid>.md`
- No parent-child relationship
- No timestamp in filenames
- Manually created prototype exists: `.pde/2603261642--a448b195-c4ba-4d92-8220-a9ac92bc6d60/`

---

## 1. Schema Changes

### 1a. `StoredDecomposition` — Add `parent_pde_id`

**File**: `src/types.ts` (lines 110-118)

```typescript
export interface StoredDecomposition {
  id: string;
  timestamp: string;
  prompt: string;
  result: DecompositionResult;
  options: DecompositionOptions;
  markdownPath?: string;
  // --- NEW (v2.1) ---
  /** UUID of parent PDE. When set, this PDE is stored inside the parent's folder. */
  parent_pde_id?: string;
  /** Folder name: <yyMMddHHmm>--<id>. Computed at save time. */
  folder_name?: string;
}
```

**Non-breaking**: Both new fields are optional. Old JSON files without them load normally.

### 1b. MCP Tool Input Types — Add `parent_pde_id`

**File**: `src/types.ts` (lines 124-145)

```typescript
export interface DecomposeInput {
  prompt: string;
  options?: Partial<DecompositionOptions>;
  workdir?: string;
  // --- NEW (v2.1) ---
  /** Parent PDE UUID. If set, child will be stored inside parent's folder. */
  parent_pde_id?: string;
}

export interface ParseResponseInput {
  llm_response: string;
  original_prompt: string;
  workdir?: string;
  options?: Partial<DecompositionOptions>;
  // --- NEW (v2.1) ---
  parent_pde_id?: string;
}

export interface ListDecompositionsInput {
  workdir?: string;
  limit?: number;
  // --- NEW (v2.1) ---
  /** When set, only list children of this parent PDE. */
  parent_pde_id?: string;
}
```

`GetDecompositionInput` and `ExportMarkdownInput` need **no changes** — `pde_get` resolves paths by scanning both old flat format and new folder format.

---

## 2. New Folder-Based Output Format

### 2a. Layout

```
.pde/
├── <uuid>.json                               # Old format (still supported for reads)
├── <uuid>.md                                 # Old format (still supported for reads)
│
├── <yyMMddHHmm>--<parent-uuid>/             # NEW: folder-based parent
│   ├── pde-<parent-uuid>.json                # Parent decomposition
│   ├── pde-<parent-uuid>.md                  # Parent markdown
│   ├── AGENTS.md                             # Agent instructions (optional)
│   │
│   ├── <yyMMddHHmm>--<child-uuid>/          # Child PDE folder
│   │   ├── pde-<child-uuid>.json
│   │   └── pde-<child-uuid>.md
│   │
│   └── <yyMMddHHmm>--<child2-uuid>/         # Another child
│       ├── pde-<child2-uuid>.json
│       └── pde-<child2-uuid>.md
```

### 2b. Timestamp Format

`yyMMddHHmm` — e.g., `2604030845` for 2026-04-03 08:45.

**Helper function** (new in `storage.ts`):

```typescript
function formatTimestamp(date: Date = new Date()): string {
  const yy = String(date.getFullYear()).slice(2);
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${yy}${MM}${dd}${HH}${mm}`;
}
```

### 2c. Folder Name Construction

```typescript
function buildFolderName(id: string, date?: Date): string {
  return `${formatTimestamp(date)}--${id}`;
}
```

### 2d. When Folder Format Is Used

| Condition | Storage Format |
|-----------|---------------|
| `parent_pde_id` is set | Child stored in parent's folder: `.pde/<parent-folder>/<yyMMddHHmm>--<child-uuid>/` |
| No `parent_pde_id` | **New default**: `.pde/<yyMMddHHmm>--<uuid>/pde-<uuid>.json|md` |
| Reading old PDE | Falls back to `.pde/<uuid>.json` if folder not found |

**All new writes use folder format.** Old flat files are read-only legacy.

---

## 3. File Modifications List

### `src/types.ts`
| Line(s) | Change |
|---------|--------|
| 110-118 | Add `parent_pde_id?: string` and `folder_name?: string` to `StoredDecomposition` |
| 124-129 | Add `parent_pde_id?: string` to `DecomposeInput` |
| 136-139 | Add `parent_pde_id?: string` to `ListDecompositionsInput` |
| (new) | Add `ParseResponseInput` interface (currently inline-typed in mcp-server.ts) |

### `src/storage.ts`
| Function | Change |
|----------|--------|
| `ensureDir()` | Support subfolder creation for parent/child paths |
| `saveDecomposition()` | **Major**: Accept `parent_pde_id`, compute folder path, write to `<folder>/pde-<id>.json|md` |
| `loadDecomposition()` | **Major**: Scan both `<id>.json` (legacy) and `*--<id>/pde-<id>.json` (new) |
| `listDecompositions()` | **Major**: Scan folders recursively; support `parent_pde_id` filter |
| (new) | `formatTimestamp()`, `buildFolderName()`, `resolveDecompositionPath()` helpers |

### `src/pde-engine.ts`
| Method | Change |
|--------|--------|
| `parseAndStore()` | Accept `parent_pde_id` param, pass through to `saveDecomposition()` |
| `get()` | Use new `resolveDecompositionPath()` for path resolution |
| `list()` | Pass `parent_pde_id` filter to `listDecompositions()` |

### `src/mcp-server.ts`
| Tool | Change |
|------|--------|
| `pde_decompose` | Add `parent_pde_id` to inputSchema and response echo |
| `pde_parse_response` | Add `parent_pde_id` to inputSchema; pass to `engine.parseAndStore()` |
| `pde_list` | Add `parent_pde_id` to inputSchema; pass to `engine.list()` |
| `pde_get` | No schema change (resolution is internal) |

### `src/cli.ts`
| Command | Change |
|---------|--------|
| `decompose` | Add `--parent` / `-p` flag |
| `parse` | Add `--parent` / `-p` flag |
| `list` | Add `--parent` / `-p` flag for filtering children |
| Console output | Update path display to show folder structure |

### `tests/pde-engine.test.ts`
| Test | Change |
|------|--------|
| `parseAndStore` | Add tests for folder-based storage |
| `parseAndStore` | Add tests for parent_pde_id child storage |
| `get` | Add tests for resolving both formats |
| `list` | Add tests for parent_pde_id filter |

### `rispecs/pde-data-models.rispec.md`
| Section | Change |
|---------|--------|
| Storage Types | Document `parent_pde_id`, `folder_name` fields |

### `rispecs/pde-tools.rispec.md`
| Section | Change |
|---------|--------|
| Tool 1-4 schemas | Document `parent_pde_id` parameter |

---

## 4. API Surface Changes

### Tool: `pde_decompose`

```diff
  inputSchema: {
    properties: {
      prompt: { type: 'string' },
      options: { ... },
+     parent_pde_id: {
+       type: 'string',
+       description: 'UUID of parent PDE. Echoed in response for pass-through to pde_parse_response.'
+     },
    },
  }
```

Response adds `parent_pde_id` echo for pipeline continuity.

### Tool: `pde_parse_response`

```diff
  inputSchema: {
    properties: {
      llm_response: { type: 'string' },
      original_prompt: { type: 'string' },
      workdir: { type: 'string' },
      options: { ... },
+     parent_pde_id: {
+       type: 'string',
+       description: 'UUID of parent PDE. When set, stores this decomposition inside the parent folder.'
+     },
    },
  }
```

### Tool: `pde_list`

```diff
  inputSchema: {
    properties: {
      workdir: { type: 'string' },
      limit: { type: 'number' },
+     parent_pde_id: {
+       type: 'string',
+       description: 'When set, only list children of this parent PDE.'
+     },
    },
  }
```

### Tool: `pde_get`

No input schema changes. Resolution logic updated internally.

---

## 5. Key Implementation: `storage.ts` Changes

### `resolveDecompositionPath()` — NEW

```typescript
/**
 * Resolve the JSON file path for a decomposition ID.
 * Tries new folder format first, falls back to legacy flat format.
 */
function resolveDecompositionPath(
  workdir: string,
  id: string,
  parentId?: string
): string | null {
  const pdeDir = join(workdir, PDE_DIR);

  // If parentId given, look inside parent's folder
  if (parentId) {
    const parentFolder = findFolderById(pdeDir, parentId);
    if (parentFolder) {
      const childFolder = findFolderById(join(pdeDir, parentFolder), id);
      if (childFolder) {
        const path = join(pdeDir, parentFolder, childFolder, `pde-${id}.json`);
        if (existsSync(path)) return path;
      }
    }
  }

  // Try new folder format: .pde/*--<id>/pde-<id>.json
  const folder = findFolderById(pdeDir, id);
  if (folder) {
    const path = join(pdeDir, folder, `pde-${id}.json`);
    if (existsSync(path)) return path;
  }

  // Recurse into all folders to find nested children
  if (existsSync(pdeDir)) {
    for (const entry of readdirSync(pdeDir)) {
      const subdir = join(pdeDir, entry);
      if (statSync(subdir).isDirectory()) {
        const childFolder = findFolderById(subdir, id);
        if (childFolder) {
          const path = join(subdir, childFolder, `pde-${id}.json`);
          if (existsSync(path)) return path;
        }
      }
    }
  }

  // Legacy flat format: .pde/<id>.json
  const legacyPath = join(pdeDir, `${id}.json`);
  if (existsSync(legacyPath)) return legacyPath;

  return null;
}

/**
 * Find a folder matching *--<id> pattern in a directory.
 */
function findFolderById(dir: string, id: string): string | null {
  if (!existsSync(dir)) return null;
  const suffix = `--${id}`;
  const match = readdirSync(dir).find(
    (f) => f.endsWith(suffix) && statSync(join(dir, f)).isDirectory()
  );
  return match || null;
}
```

### `saveDecomposition()` — UPDATED

```typescript
export function saveDecomposition(
  workdir: string,
  id: string,
  prompt: string,
  result: DecompositionResult,
  options: DecompositionOptions,
  parentPdeId?: string    // NEW parameter
): StoredDecomposition {
  const pdeDir = join(workdir, PDE_DIR);
  const now = new Date();
  const folderName = buildFolderName(id, now);

  let targetDir: string;

  if (parentPdeId) {
    // Find parent's folder
    const parentFolder = findFolderById(pdeDir, parentPdeId);
    if (!parentFolder) {
      throw new Error(
        `Parent PDE ${parentPdeId} not found in ${pdeDir}. ` +
        `Parent must be saved first.`
      );
    }
    targetDir = join(pdeDir, parentFolder, folderName);
  } else {
    // Top-level: new folder format
    targetDir = join(pdeDir, folderName);
  }

  mkdirSync(targetDir, { recursive: true });

  const stored: StoredDecomposition = {
    id,
    timestamp: now.toISOString(),
    prompt,
    result,
    options,
    parent_pde_id: parentPdeId,
    folder_name: folderName,
  };

  // Save JSON
  const jsonPath = join(targetDir, `pde-${id}.json`);
  writeFileSync(jsonPath, JSON.stringify(stored, null, 2), "utf-8");

  // Save Markdown
  const mdPath = join(targetDir, `pde-${id}.md`);
  const md = decompositionToMarkdown(result, prompt);
  writeFileSync(mdPath, md, "utf-8");
  stored.markdownPath = mdPath;

  return stored;
}
```

### `loadDecomposition()` — UPDATED

```typescript
export function loadDecomposition(
  workdir: string,
  id: string
): StoredDecomposition | null {
  const resolved = resolveDecompositionPath(workdir, id);
  if (!resolved) return null;
  const raw = readFileSync(resolved, "utf-8");
  return JSON.parse(raw) as StoredDecomposition;
}
```

### `listDecompositions()` — UPDATED

```typescript
export function listDecompositions(
  workdir: string,
  limit?: number,
  parentPdeId?: string    // NEW parameter
): StoredDecomposition[] {
  const pdeDir = join(workdir, PDE_DIR);
  if (!existsSync(pdeDir)) return [];

  const results: StoredDecomposition[] = [];

  if (parentPdeId) {
    // List children of a specific parent
    const parentFolder = findFolderById(pdeDir, parentPdeId);
    if (!parentFolder) return [];
    const parentDir = join(pdeDir, parentFolder);
    for (const entry of readdirSync(parentDir)) {
      if (entry.includes('--') && statSync(join(parentDir, entry)).isDirectory()) {
        const childId = entry.split('--').pop()!;
        const jsonPath = join(parentDir, entry, `pde-${childId}.json`);
        if (existsSync(jsonPath)) {
          results.push(JSON.parse(readFileSync(jsonPath, 'utf-8')));
        }
      }
    }
  } else {
    // List all top-level decompositions

    // New format: folders matching *--<uuid>/
    for (const entry of readdirSync(pdeDir)) {
      const fullPath = join(pdeDir, entry);
      if (entry.includes('--') && statSync(fullPath).isDirectory()) {
        const id = entry.split('--').pop()!;
        const jsonPath = join(fullPath, `pde-${id}.json`);
        if (existsSync(jsonPath)) {
          results.push(JSON.parse(readFileSync(jsonPath, 'utf-8')));
        }
      }
    }

    // Legacy format: .pde/<uuid>.json
    for (const entry of readdirSync(pdeDir)) {
      if (entry.endsWith('.json') && !entry.startsWith('pde-')) {
        const fullPath = join(pdeDir, entry);
        if (statSync(fullPath).isFile()) {
          results.push(JSON.parse(readFileSync(fullPath, 'utf-8')));
        }
      }
    }
  }

  // Sort by timestamp descending
  results.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return limit ? results.slice(0, limit) : results;
}
```

---

## 6. Migration Strategy

### Backward Compatibility Rules

1. **Old `.pde/<uuid>.json` files are never moved or modified** — they remain readable
2. **All new writes use folder format** — even top-level PDEs without a parent
3. **`pde_get` resolves transparently** — tries folder format first, falls back to flat
4. **`pde_list` merges both formats** — deduplicates by ID if a PDE exists in both
5. **No migration script needed** — coexistence is the strategy

### Version Bump

- `package.json`: `2.0.1` → `2.1.0` (minor: new non-breaking features)
- `mcp-server.ts`: server version `2.0.0` → `2.1.0`

### Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Parent folder not found when saving child | Throw clear error: "Parent must be saved first" |
| UUID collision in folder scan | UUID v4 collision probability is negligible |
| Performance with many folders | `readdirSync` is fast; add caching later if needed |
| Breaking existing .pde/ consumers | Old format still works; new fields are optional |

---

## 7. Implementation Estimate

### This Session (Phase 1 — EAST Design) ✅
- [x] Analyze codebase completely
- [x] Design schema changes
- [x] Identify all insertion points with line numbers
- [x] Write design document (this file)

### Next Session (Phase 2 — SOUTH/WEST Implementation)
**Estimated: 1 focused session**

1. **`src/types.ts`** — Add fields (~5 min)
2. **`src/storage.ts`** — Implement folder logic (~45 min, most complex)
3. **`src/pde-engine.ts`** — Pass-through params (~10 min)
4. **`src/mcp-server.ts`** — Tool schema additions (~15 min)
5. **`src/cli.ts`** — `--parent` flag (~10 min)
6. **Tests** — New test cases for folder format + parent-child (~30 min)
7. **rispecs update** — Document new schemas (~10 min)
8. **Build + verify** — `npm run build && npm test` (~5 min)

### Deferred (Phase 3 — NORTH)
- `AGENTS.md` auto-generation inside PDE folders
- Recursive child listing (grandchildren)
- `pde_tree` tool for visualizing hierarchy
- coaia-pde adoption of the new format
- mia-code/miaco widget upgrades (separate repos, separate issues)

---

## 8. Structural Tension Summary

| Aspect | Current Reality | Desired Outcome |
|--------|----------------|-----------------|
| **Storage** | Flat `.pde/<uuid>.json` | Timestamped folders with parent-child nesting |
| **Lineage** | None — each PDE is an island | `parent_pde_id` traces decomposition → sub-decomposition |
| **Navigability** | UUIDs are opaque | `<yyMMddHHmm>--<uuid>/` folders show time + structure |
| **Agent support** | No `AGENTS.md` convention | Folder format naturally hosts `AGENTS.md` alongside PDE |
| **Backward compat** | N/A | Old flat files remain readable forever |

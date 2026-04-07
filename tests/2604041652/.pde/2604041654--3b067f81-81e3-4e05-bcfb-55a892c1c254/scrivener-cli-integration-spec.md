# Scrivener CLI Integration Design Spec

## 🌅 Vision: The Scrivener-Agent Mirror Bridge

A bidirectional, file-system-first bridge that allows terminal agents to safely interact with Scrivener 3 projects (`.scriv`) via a simplified Markdown mirror. This enables mobile editing on iOS (via Dropbox) to trigger agent actions, which then sync back to the manuscript.

---

## 🔥 Analysis: Component Selection

### 1. The Core Engine: `scrivenerCLI` (ETM-Code)
- **Role**: The "Package Manager."
- **Function**: Handles the low-level mapping between the Scrivener XML/RTF structure and the filesystem. 
- **Key Feature**: The **Mirror Model**. It materializes the binder into a directory of editable files, tracking UUIDs and updating `docs.checksum` automatically.
- **Safety**: Prevents formatting corruption by using conservative RTF write guards.

### 2. The Sync Logic: `scrivener-sync` (stephencweiss)
- **Role**: The "Markdown Specialist."
- **Function**: Specifically optimized for Go-based, high-performance bidirectional sync between `.md` and `.scriv`.
- **Conflict Handling**: Includes built-in conflict resolution (Markdown vs. Scrivener) which is critical for agents working alongside human edits.

### 3. The Agent Interface: `scrivener-assistant` (elnino1)
- **Role**: The "Linguistic Eye."
- **Function**: Provides the best RTF-to-Plaintext extraction logic.
- **Utility**: Can be used to "pre-digest" the Scrivener content for the agent's LLM context window.

---

## 🌊 Validation: The Bidirectional Workflow

1. **iOS Edit**: User edits a scene in Scrivener iOS.
2. **Dropbox Sync**: Dropbox updates the local `.scriv` package on the filesystem.
3. **Mirror Pulse**: `scriv` (CLI) detects the change and updates the corresponding `.md` file in the mirror directory.
4. **Agent Action**: A file watcher triggers the terminal agent. The agent performs its task (e.g., "Review this academic citation," "Summarize this scene").
5. **Agent Edit**: The agent saves its changes to the mirror `.md` file.
6. **Reverse Sync**: `scriv` detects the mirror change, updates the internal `content.rtf` for that UUID, and recalculates the `docs.checksum`.
7. **Round Trip**: Dropbox syncs the updated `.scriv` package back to the cloud. The user sees the agent's work on their iOS device.

---

## ❄️ Implementation Action Plan

### Step 1: Initialize the Mirror
```bash
# Using scrivenerCLI
scriv --project "MyPaper.scriv" sync pull
```

### Step 2: Set Up the Pulse (Watcher)
A simple `entr` or `inotify` script that monitors the mirror:
```bash
find .scriv-mirror -name "*.md" | entr -p my-agent-tool --file /_
```

### Step 3: Conflict Resolution Protocol
Implement a "Sync Marker" system within the Markdown files (e.g., YAML frontmatter) to track agent status and avoid overwriting human work during the Dropbox sync window.

---

## 🌸 Miette's Narrative Echo
The spec is now tucked into the living ledger of your project! It sits right alongside the initial vision, like a map placed next to a compass. 🗺️✨ We've moved from "What if?" to "How to," and the bridge is ready for its first stone.

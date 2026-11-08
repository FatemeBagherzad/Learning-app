import type { Section } from '../types'

/**
 * The Markdown/config files that AI coding tools read.
 *
 * These are spread in at the FRONT of the AI sheet's sections (see ./ai.ts),
 * so they are the first cards on the AI tab.
 *
 * Formats here move fast. Written November 2026 — when something does not
 * work, check the tool's own docs, and use the "prove what got loaded"
 * snippet in the best-practices section rather than guessing.
 */
const aiConfigFiles: Section[] = [
  {
    title: 'AI config files — who reads what',
    blurb:
      'Every tool invented its own instructions file, then most of them agreed on AGENTS.md. This card is the whole landscape; the cards after it give each file its exact format. Nothing here is loaded by magic — each file belongs to a named tool, and a file no tool names is never read.',
    snippets: [
      {
        note: 'The shared standard — one file, many tools',
        lang: 'shell',
        code: `AGENTS.md          OpenAI Codex, GitHub Copilot, Cursor, Google Jules,
                   Zed, Devin, Factory, Roo Code, OpenCode, Claude Code
                   (Gemini CLI reads it only if you rename its file to it)

AGENT.md           Amp (Sourcegraph) — singular, and Amp only.
                   Nobody else reads AGENT.md. Nobody reads AGENTS.MD.`,
      },
      {
        note: 'One tool only — the file is part of that product',
        lang: 'shell',
        code: `CLAUDE.md                            Claude Code, Claude Desktop
MEMORY.md + memory/*.md              Claude Code auto-memory (not in your repo)
.claude/skills/<n>/SKILL.md          Claude skills
.claude/agents/<n>.md                Claude subagents
.claude/commands/<n>.md              Claude slash commands

.github/copilot-instructions.md      GitHub Copilot (editor AND github.com)
.github/instructions/*.instructions.md  Copilot, per-path
.github/prompts/*.prompt.md          Copilot Chat, when you type /name
.github/chatmodes/*.chatmode.md      Copilot Chat modes

.cursor/rules/*.mdc                  Cursor
.cursorrules                         Cursor (legacy, still read)

GEMINI.md                            Gemini CLI
.gemini/styleguide.md                Gemini Code Assist PR reviews
.windsurf/rules/*.md                 Windsurf
.clinerules  /  .clinerules/*.md     Cline
.roo/rules/*.md  /  .roorules        Roo Code
.rules                               Zed
CONVENTIONS.md                       Aider — and only with --read
AGENTS.md                            Codex: see above`,
      },
      {
        note: 'The three questions that actually tell these files apart. Ask them about any file and the confusion goes away.',
        lang: 'shell',
        code: `1. WHO reads it?       one tool, or the AGENTS.md crowd?
2. WHEN is it loaded?  every single request (costs tokens every turn)
                       only when a glob matches the file being edited
                       only when the model decides it is relevant
                       only when you type its name
3. WHAT may it contain?  prose only, or frontmatter?
                         and can it run tools / commands, or only advise?

# Example, same question three ways:
#   CLAUDE.md                -> Claude only, every request, prose, advises
#   *.instructions.md        -> Copilot only, glob match, frontmatter, advises
#   .claude/skills/x/SKILL.md -> Claude only, model decides, frontmatter, RUNS`,
      },
    ],
  },

  {
    title: 'AGENTS.md — the one shared standard',
    blurb:
      'Plain Markdown at the repo root. No frontmatter, no required headings, no schema — that is the whole point, and it is why so many tools agreed to read it. Write it for a competent new engineer who has never seen the repo.',
    snippets: [
      {
        note: 'A real one. Commands first: that is the part every agent uses on every task.',
        lang: 'yaml',
        code: `# AGENTS.md

## What this is
A Vite + React + TypeScript single-page app. No backend, no router.
State lives in src/App.tsx; there is no state library and we are not adding one.

## Setup
npm ci                  # never npm install — the lockfile is authoritative
cp .env.example .env    # app runs without it; only e2e needs real keys

## Commands
Dev server      npm run dev          # port 5173
Typecheck       npx tsc --noEmit     # must be clean before any commit
Unit tests      npm test -- --run    # watch mode hangs CI
Lint + fix      npm run lint -- --fix
Build           npm run build        # fails on type errors; that is intended
One test file   npm test -- src/lib/date.test.ts

## Code style
- TypeScript strict. No "any", no non-null "!" — narrow the type instead.
- Named exports only. The one default export allowed is a React component.
- No new dependency without asking. Three deps is a feature of this repo.
- Files are kebab-case, components PascalCase, hooks use-thing.ts.

## Project layout
src/data/*.ts     one file per content sheet; src/data/index.ts sets the order
src/lib/          pure functions, no React imports, always unit-tested
src/components/   presentational only; no fetching, no localStorage

## Testing
- Vitest + Testing Library. Query by role or label, never by class name.
- A bug fix lands with the test that would have caught it, in the same commit.

## Pull requests
- Title: "area: what changed" — e.g. "data: add Helm sheet".
- Run typecheck, lint and tests before opening. CI runs the same three.
- Do not touch package-lock.json unless the PR is about a dependency.

## Do not
- Do not commit to main.
- Do not edit src/generated/** — it is produced by npm run codegen.
- Do not reformat a file you did not otherwise change.`,
      },
      {
        note: 'Nesting in a monorepo. The file nearest the code being edited is the one that wins.',
        lang: 'shell',
        code: `repo/
  AGENTS.md              # everything true of the whole repo
  apps/
    web/AGENTS.md        # overrides the root while editing apps/web/**
    api/AGENTS.md        # overrides the root while editing apps/api/**
  packages/
    ui/AGENTS.md         # overrides the root while editing packages/ui/**

# Nearest wins, but HOW is not identical across tools:
#   Codex, Copilot  merge root + nested, nested takes priority on conflict
#   Cursor          AGENTS.md is treated like an always-on rule
#   Claude Code     parent memory stays loaded; the nested file is added
#
# So: never contradict the root file in a nested one. Put repo-wide truth
# in the root and only ADD package-specific facts below it. A nested file
# that says the opposite of the root is a coin flip.`,
      },
      {
        note: 'Global AGENTS.md — your preferences, every repo, not committed anywhere',
        lang: 'shell',
        code: `~/.codex/AGENTS.md        # Codex CLI, applies to every project
~/.claude/CLAUDE.md       # Claude Code, same idea

# Put personal taste here, never in the repo file:
#   "Explain in short paragraphs, not bullet lists."
#   "I use pnpm locally even when the repo says npm."
#   "Never run git push. Hand me the command."`,
      },
    ],
  },

  {
    title: 'CLAUDE.md — Claude Code project memory',
    blurb:
      'Same job as AGENTS.md, Claude-only, plus two things AGENTS.md does not have: a documented four-level precedence order, and @-imports so one file can pull in others. Loaded on every request — which is exactly why it must stay short.',
    snippets: [
      {
        note: 'The four places it can live, highest priority first. All four are concatenated, not replaced.',
        lang: 'shell',
        code: `1  C:\\ProgramData\\ClaudeCode\\CLAUDE.md     enterprise / managed policy
   /Library/Application Support/ClaudeCode/CLAUDE.md   (macOS)
   /etc/claude-code/CLAUDE.md                          (Linux)

2  ./CLAUDE.md            project root, COMMITTED, shared with the team
                          (and ./.claude/CLAUDE.md works the same way)

3  ~/.claude/CLAUDE.md    you, across every project, never committed

4  ./sub/dir/CLAUDE.md    loaded on demand — only when Claude actually
                          touches a file under sub/dir/

# CLAUDE.local.md is deprecated. For private project notes, import a
# gitignored file from the committed CLAUDE.md instead (next snippet).`,
      },
      {
        note: '@-imports: keep the always-loaded file tiny and pull in the rest. Max 5 hops deep.',
        lang: 'yaml',
        code: `# CLAUDE.md  (committed, deliberately ~40 lines)

See @README.md for what this app is and @package.json for the scripts.

## Rules that matter
- Typecheck must be clean: npx tsc --noEmit
- No new dependencies without asking.

## Detail, loaded with this file
@docs/architecture.md
@docs/testing.md

## My private notes (gitignored, so this line resolves to nothing for others)
@CLAUDE.private.md

# Notes on imports:
# - a path in a code span or a fenced block is NOT imported
# - ~/ works: @~/.claude/my-shell-aliases.md
# - an import is pulled in EVERY request, so importing a 3000-line doc
#   costs you that doc on every turn. Link it in prose instead and let
#   Claude read it when it needs it.`,
      },
      {
        note: 'Working with it day to day',
        lang: 'shell',
        code: `/init          generate a first CLAUDE.md by scanning the repo
/memory        open the memory files in your editor — AND see exactly
               which ones the version you are running has loaded
# text         a line starting with # is saved as a memory; Claude asks
               which file to put it in

# Claude Code also reads AGENTS.md. If you want one file for every tool,
# keep AGENTS.md as the real file and make CLAUDE.md a pointer:
#     echo "Follow @AGENTS.md." > CLAUDE.md
# Run /memory afterwards to confirm what is actually loaded — that is
# the only answer that counts, whatever any blog post says.`,
      },
    ],
  },

  {
    title: 'Claude memory that is not CLAUDE.md',
    blurb:
      'Two different things both get called "memory". CLAUDE.md is a file in your repo that you write. Auto-memory is a folder outside your repo that Claude writes. Mixing them up is the single most common misunderstanding here.',
    snippets: [
      {
        note: 'Auto-memory: one fact per file, plus an index. Lives in the Claude Code config dir, per project — not in your repo, not in git, never shared.',
        lang: 'shell',
        code: `~/.claude/projects/<slugified-project-path>/memory/
    MEMORY.md                      the index — loaded into context each session
    no-force-push.md               one fact
    prefers-vitest-over-jest.md    one fact
    netlify-deploy-is-manual.md    one fact

# MEMORY.md holds ONE LINE PER MEMORY and nothing else:
#   - [No force pushes](no-force-push.md) — ask before anything leaves the machine.
#   - [Deploys are manual](netlify-deploy-is-manual.md) — Netlify is not wired to git.`,
      },
      {
        note: 'The format of one memory file. The frontmatter is what makes it findable later.',
        lang: 'yaml',
        code: `---
name: no-force-push
description: Never push or force-push; hand over the command instead
metadata:
  type: feedback        # user | feedback | project | reference
---

Never run git push, and never commit without being asked. Print the
command for me to run.

**Why:** the repo is published under my name only, and I review what
leaves this machine.
**How to apply:** finish the work locally, then give me the commands.

Related: [[deploys-are-manual]]`,
      },
      {
        note: 'CLAUDE.md vs auto-memory vs a chat Project — the actual differences',
        lang: 'shell',
        code: `                    CLAUDE.md          auto-memory        Project instructions
                                       (MEMORY.md)        (claude.ai UI)
written by          you                Claude             you
lives in            your repo          ~/.claude/...      Anthropic's servers
in git              yes, committed     no                 no
shared with team    yes                no                 only via the Project
survives a reclone  yes                no                 n/a
scope               that repo          that repo path     that Project's chats
read by             Claude Code+Desktop Claude Code        claude.ai / Desktop

# Rule of thumb: if a new teammate would need to know it, it belongs in
# CLAUDE.md or AGENTS.md. If it is about YOU and how you like to work,
# it belongs in auto-memory or ~/.claude/CLAUDE.md.`,
      },
    ],
  },

  {
    title: 'Claude Markdown that runs: skills, subagents, commands',
    blurb:
      'The files above only advise. These four do things — they carry YAML frontmatter, they can restrict which tools are allowed, and three of them are invoked rather than always loaded. This is the category no other tool has in Markdown form.',
    snippets: [
      {
        note: 'Where they go. Project copies are committed and shared; the ~/.claude ones are yours alone.',
        lang: 'shell',
        code: `.claude/skills/<name>/SKILL.md     a skill (+ any helper files beside it)
.claude/agents/<name>.md          a subagent
.claude/commands/<name>.md        a slash command  -> /name
.claude/output-styles/<name>.md   an output style

~/.claude/skills/... agents/... commands/...    the same, for every project

# Not Markdown, but they live in the same folder and people mix them up:
.claude/settings.json         committed: permissions, hooks, env
.claude/settings.local.json   gitignored: your machine only
.mcp.json                     committed: MCP servers for this project
.claude-plugin/plugin.json    a plugin's manifest`,
      },
      {
        note: 'SKILL.md — loaded by DESCRIPTION. Only name + description sit in context; the body arrives when Claude decides the skill is relevant, so the description is the whole trigger.',
        lang: 'yaml',
        code: `---
name: release-checklist
description: >
  Cut a release of this app. Use when the user asks to release, ship, tag
  or publish a version, or mentions bumping the version number.
allowed-tools: Read, Edit, Bash(npm run build), Bash(git tag:*)
---

# Release checklist

1. Confirm the working tree is clean and tests pass.
2. Bump the version in package.json (semver; patch unless told otherwise).
3. Update CHANGELOG.md — see references/changelog-format.md.
4. npm run build, then check dist/ is non-empty.
5. STOP. Print the git tag and push commands for the user to run.

# description is a trigger, not a title. "Release helper" never fires.
# Write it as: what it does + when to use it + the words a user would say.`,
      },
      {
        note: 'Subagent and slash command — note how differently they are reached',
        lang: 'yaml',
        code: `# .claude/agents/test-writer.md  — a separate context window with its own tools
---
name: test-writer
description: Writes Vitest tests for a module. Use after changing src/lib/**.
tools: Read, Write, Bash
model: sonnet
---
You write tests only. Never change the implementation; if it looks wrong,
say so and stop. Query by role, never by CSS class.


# .claude/commands/fix-issue.md  — fires when the user types /fix-issue 42
---
description: Fix a GitHub issue end to end
argument-hint: <issue-number>
allowed-tools: Bash(gh issue view:*), Read, Edit
---
Issue: !gh issue view $ARGUMENTS --json title,body

Current conventions: @AGENTS.md

Fix it, add a test, and show me the diff. Do not commit.

# $ARGUMENTS = everything typed; $1 $2 = positional
# !command    = run it now, put the output in the prompt
# @path       = inline that file`,
      },
    ],
  },

  {
    title: 'GitHub Copilot — the instructions files',
    blurb:
      'Copilot splits the job across four file types with four different triggers. Getting these confused is why people say "Copilot ignores my instructions" — usually the file is right but the trigger is wrong.',
    snippets: [
      {
        note: 'Repo-wide: .github/copilot-instructions.md. Always applied, no frontmatter, one file. Used by Copilot Chat, the coding agent AND code review on github.com.',
        lang: 'yaml',
        code: `# .github/copilot-instructions.md

This is a Vite + React + TypeScript SPA. No backend.

## Build and test
- Install with npm ci. Typecheck with npx tsc --noEmit.
- Run tests with npm test -- --run.

## Conventions
- TypeScript strict; never use any or the non-null ! operator.
- Named exports only, except React components.
- Tests sit next to the file they test as *.test.ts.

## Review focus
- Flag any new runtime dependency.
- Flag a useEffect with no cleanup and no dependency array.

# In VS Code this file is only used when this setting is on:
#   "github.copilot.chat.codeGeneration.useInstructionFiles": true
# On github.com (code review, coding agent) it is always used.`,
      },
      {
        note: 'Per-path: .github/instructions/*.instructions.md. Applied only when the file being worked on matches applyTo. This is the one people reach for too late.',
        lang: 'yaml',
        code: `# .github/instructions/tests.instructions.md
---
applyTo: "**/*.test.ts,**/*.test.tsx"
description: How we write tests
---
- Vitest, not Jest. No jest.mock — use vi.mock.
- Query by role or label. Never by class name or test id.
- One behaviour per test; the name says the behaviour, not the function.


# .github/instructions/sql.instructions.md
---
applyTo: "db/migrations/**/*.sql"
---
- Every migration is reversible and has a matching .down.sql.
- Never DROP a column in the same release that stops writing to it.

# applyTo: "**"  means every file — same reach as copilot-instructions.md.
# Many narrow files beat one long one: each costs tokens only when it matches.`,
      },
      {
        note: 'Invoked, not automatic: prompt files and chat modes. These are NOT read during code review or by the coding agent.',
        lang: 'yaml',
        code: `# .github/prompts/new-sheet.prompt.md   -> type /new-sheet in Copilot Chat
---
mode: agent
description: Add a new cheat-sheet tab
tools: ['codebase', 'editFiles']
---
Create src/data/\${input:name}.ts following src/data/python.ts, then import
it in src/data/index.ts. Selected text for reference: \${selection}


# .github/chatmodes/reviewer.chatmode.md  -> pick "reviewer" in the chat UI
---
description: Read-only reviewer
tools: ['codebase', 'search']
---
Review only. Never edit a file. Report findings as file:line + one sentence.

# Variables available in prompt files: \${selection} \${file}
# \${workspaceFolder} \${input:name} \${input:name:placeholder}`,
      },
      {
        note: 'Instructions straight in settings.json — no file at all. Handy for commit messages, which no .md file covers.',
        lang: 'typescript',
        code: `// .vscode/settings.json (committed) or your user settings
{
  "github.copilot.chat.codeGeneration.useInstructionFiles": true,
  "chat.promptFiles": true,
  "chat.instructionsFilesLocations": [".github/instructions"],

  "github.copilot.chat.commitMessageGeneration.instructions": [
    { "text": "Conventional Commits. Subject under 60 chars, no period." }
  ],
  "github.copilot.chat.reviewSelection.instructions": [
    { "file": ".github/instructions/review.instructions.md" }
  ],
  "github.copilot.chat.testGeneration.instructions": [
    { "text": "Vitest with Testing Library. No snapshots." }
  ]
}`,
      },
    ],
  },

  {
    title: 'Copilot inside GitHub — what runs on a push or PR',
    blurb:
      'Two different Copilot features run on github.com, and they read different files. Code review comments on a PR. The coding agent writes the PR. Neither of them ever sees your .cursorrules, CLAUDE.md, prompt files or chat modes.',
    snippets: [
      {
        note: 'Code review — reads these, ignores the rest',
        lang: 'shell',
        code: `READS
  .github/copilot-instructions.md            repo-wide
  .github/instructions/*.instructions.md     where applyTo matches a
                                             changed file in the PR
  AGENTS.md                                  nearest one to each changed file

IGNORES
  .github/prompts/*.prompt.md       invoked-only, never automatic
  .github/chatmodes/*.chatmode.md   editor UI only
  .cursorrules, CLAUDE.md, GEMINI.md, .clinerules, .windsurfrules
  anything in .vscode/settings.json  (your editor, not GitHub's servers)

# Turning it on: per repository or per org in Copilot settings, or add
# "Request pull request review from Copilot" to a branch ruleset so every
# PR into main gets reviewed automatically. You can also ask for one by
# hand from the Reviewers menu on any PR.
# Review instructions work best as checkable statements:
#   good: "Flag a fetch() with no AbortController."
#   bad:  "Make sure the code is high quality."`,
      },
      {
        note: 'Coding agent — you assign it an issue, it pushes a branch and opens a PR. Give it a working environment or it wastes its session installing things.',
        lang: 'yaml',
        code: `# .github/workflows/copilot-setup-steps.yml
# YAML, not Markdown — but it is the other half of configuring the agent.
name: "Copilot Setup Steps"
on: workflow_dispatch

jobs:
  copilot-setup-steps:        # this job id must be EXACTLY this
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
      - run: npm ci

# The agent reads AGENTS.md and .github/copilot-instructions.md for HOW to
# work, and this file for WHAT is installed before it starts. Secrets come
# from the Copilot environment in repo settings, not from Actions secrets.`,
      },
      {
        note: 'The GitHub-standard Markdown that shapes agent output — ordinary repo files, not AI config, but every agent that opens a PR is steered by them',
        lang: 'shell',
        code: `.github/PULL_REQUEST_TEMPLATE.md    the PR body an agent fills in
.github/ISSUE_TEMPLATE/*.md        the issue shape it is handed
CONTRIBUTING.md                    conventions humans and agents both read
CODEOWNERS                         who gets asked to review the agent's PR
README.md                          usually the first thing read for context
SECURITY.md  CODE_OF_CONDUCT.md    standard, rarely load-bearing for agents

# Leverage: a PR template with real checkboxes ("typecheck clean", "test
# added") turns into a checklist the agent walks. Keep CONTRIBUTING.md and
# AGENTS.md consistent — when they disagree, you get whichever was read last.`,
      },
    ],
  },

  {
    title: 'Cursor — .cursor/rules/*.mdc',
    blurb:
      'Cursor is the one tool whose rule files choose their own trigger. The frontmatter is not decoration: the combination of description, globs and alwaysApply is what decides whether a rule is loaded always, on a path match, at the model\u2019s discretion, or never unless you name it.',
    snippets: [
      {
        note: 'The four rule types, and the exact frontmatter that produces each',
        lang: 'yaml',
        code: `# 1. ALWAYS — in context on every request. Keep these few and short.
---
alwaysApply: true
---
Use pnpm. TypeScript strict. Never edit src/generated/**.


# 2. AUTO ATTACHED — only when the file being edited matches a glob.
---
description: API route conventions
globs: ["app/api/**/*.ts"]
alwaysApply: false
---
Every route validates its body with zod before touching the database.


# 3. AGENT REQUESTED — the model reads the description and decides.
#    description is REQUIRED here; it is the only thing the model sees first.
---
description: Use when adding or changing a database migration
alwaysApply: false
---
Migrations are reversible. Never DROP a column in the release that stops
writing to it. @db/migrations/0001_init.sql


# 4. MANUAL — only when you type @rule-name in the chat.
---
alwaysApply: false
---
Full accessibility audit checklist...`,
      },
      {
        note: 'Layout, nesting and the legacy file',
        lang: 'shell',
        code: `.cursor/rules/
    always.mdc          alwaysApply: true — the short one
    api.mdc             globs: app/api/**
    testing.mdc         globs: **/*.test.ts
    migrations.mdc      agent-requested
apps/web/.cursor/rules/ # nested: applies while editing apps/web/**
.cursor/commands/*.md   # typed as /name in chat
.cursorignore           # never read these files at all
.cursorindexingignore   # index-exempt, but still readable on request

.cursorrules            # LEGACY: plain text at the repo root, no frontmatter,
                        # always applied. Still read, but deprecated — it
                        # cannot be scoped, so one stale line taxes every
                        # request. Move it into .cursor/rules/ and delete it.

# Cursor also reads AGENTS.md, treated as an always-on rule.
# Generate a rule from a chat you liked: /Generate Cursor Rules
# Verify what loaded: the rule shows up in the request's context list, and
# Settings -> Rules lists every rule Cursor found, project and user level.`,
      },
      {
        note: 'User rules — global, typed into Cursor Settings, NOT a file in the repo',
        lang: 'shell',
        code: `Cursor Settings -> Rules -> User Rules

# Plain text, applies to every project you open. This is where personal
# taste goes, and it is why your colleague gets different output from the
# same repo: their user rules are not in git and you cannot see them.
#   "Answer in short paragraphs. No bullet lists unless I ask."
#   "Never run destructive git commands. Show me the command instead."`,
      },
    ],
  },

  {
    title: 'OpenAI Codex — AGENTS.md all the way down',
    blurb:
      'Codex invented no Markdown of its own: AGENTS.md is the file, in the repo and in your home directory. Everything else about Codex is TOML, not Markdown.',
    snippets: [
      {
        note: 'What it reads, in order',
        lang: 'shell',
        code: `~/.codex/AGENTS.md        you, every project (was instructions.md)
<repo>/AGENTS.md          the project
<repo>/sub/dir/AGENTS.md  nearest one to the file being edited wins

# Everything applicable is merged; the nearest file wins a conflict.
# Same file as Copilot and Cursor read — one AGENTS.md serves all three.`,
      },
      {
        note: 'Codex config is TOML, and it is where approvals and sandboxing live — not in AGENTS.md',
        lang: 'shell',
        code: `# ~/.codex/config.toml
model = "gpt-5-codex"
approval_policy = "on-request"      # untrusted | on-request | never
sandbox_mode = "workspace-write"    # read-only | workspace-write

# Keep this straight: AGENTS.md says HOW to write code in this repo.
# config.toml says WHAT Codex is allowed to do to your machine. Writing
# "never run rm -rf" in AGENTS.md is a request; sandbox_mode is a rule.`,
      },
      {
        note: 'Codex on GitHub',
        lang: 'shell',
        code: `# Install the Codex GitHub app on a repo and it can review PRs and work
# on tasks from github.com. It reads the same AGENTS.md files.
#
#   @codex review          ask for a review in a PR comment
#   @codex fix the lint failure
#
# Review-only guidance goes in AGENTS.md under a heading of its own:
#
#   ## Review checklist
#   - Flag any new dependency.
#   - Flag a public function with no JSDoc.
#   - Do not comment on formatting; Prettier owns that.`,
      },
    ],
  },

  {
    title: 'Gemini, Windsurf, Cline, Roo, Zed, Aider, Amp',
    blurb:
      'The rest of the field, with the exact filename and the exact trigger. Two patterns repeat: a single always-loaded file at the root (the old way), or a rules folder with frontmatter (the new way).',
    snippets: [
      {
        note: 'Gemini — CLI and the GitHub reviewer are configured completely differently',
        lang: 'yaml',
        code: `# Gemini CLI: GEMINI.md, hierarchical like CLAUDE.md
~/.gemini/GEMINI.md      global
<repo>/GEMINI.md         project
<repo>/sub/GEMINI.md     subtree
/memory show             print exactly what is loaded
/memory refresh          reload after editing

# Point it at AGENTS.md instead, so you keep one file:
# .gemini/settings.json
{ "contextFileName": "AGENTS.md" }


# Gemini Code Assist reviewing PRs on GitHub reads TWO other files:
# .gemini/config.yaml
have_fun: false
code_review:
  disable: false
  comment_severity_threshold: MEDIUM   # LOW | MEDIUM | HIGH | CRITICAL
  pull_request_opened:
    summary: true
    code_review: true
ignore_patterns:
  - "dist/**"

# .gemini/styleguide.md — free-form Markdown, the review rubric:
#   - Prefer early returns over nested conditionals.
#   - Every exported function needs a JSDoc line.
#   - Do not comment on formatting.`,
      },
      {
        note: 'Windsurf, Cline, Roo Code — rules folders with per-file triggers',
        lang: 'yaml',
        code: `# Windsurf: .windsurf/rules/*.md
---
trigger: glob            # always_on | glob | model_decision | manual
globs: ["src/**/*.tsx"]
description: React conventions
---
Function components only. No class components.

.windsurfrules                                legacy root file, always on
~/.codeium/windsurf/memories/global_rules.md   your global rules


# Cline
.clinerules                 a single file, always applied
.clinerules/*.md            or a folder — all of them applied
.clinerules/workflows/*.md  invoked with /workflow-name
.clineignore                files Cline may not read


# Roo Code
.roo/rules/*.md             always applied
.roo/rules-code/*.md        applied only in Code mode
.roo/rules-architect/*.md   applied only in Architect mode
.roorules                   legacy root file
.roomodes                   custom mode definitions`,
      },
      {
        note: 'Zed, Aider, Amp, Continue — and the one that reads everybody else\u2019s files',
        lang: 'shell',
        code: `# Zed: .rules at the worktree root. Zed is the magpie — it also reads
# AGENTS.md, CLAUDE.md, .cursorrules, .windsurfrules, .clinerules and
# .github/copilot-instructions.md, so a Zed user inherits whatever you
# already wrote for another tool.

# Aider: CONVENTIONS.md is just a file name by convention. Nothing is
# automatic — you must load it:
aider --read CONVENTIONS.md
# or .aider.conf.yml:
#   read: CONVENTIONS.md

# Amp (Sourcegraph): AGENT.md — singular. Easiest file in this whole
# sheet to get wrong, because AGENTS.md sits right next to it.

# Continue: .continue/rules/*.md with frontmatter globs + alwaysApply,
# plus config.yaml for models and MCP.

# Google Jules, Devin, Factory, OpenCode: AGENTS.md.`,
      },
    ],
  },

  {
    title: 'One source of truth — what can be shared, what cannot',
    blurb:
      'The goal is one file you maintain and several thin pointers. What stops you is not the prose — that is portable — it is the frontmatter dialects and the tool-specific nouns. Split your content along that line and the duplication mostly disappears.',
    snippets: [
      {
        note: 'Portable vs not. Decide this once, per paragraph.',
        lang: 'shell',
        code: `SHARE IT — true no matter which tool is reading
  what the project is, and what it is not
  setup + the exact commands (install, dev, test, typecheck, build, one test)
  code style and naming
  directory map, and which paths are generated or off-limits
  testing policy, PR and commit conventions
  domain glossary ("a 'sheet' is one tab of the app")
  the do-not list

DO NOT SHARE — meaningless or harmful in another tool
  frontmatter of any kind (applyTo / globs / alwaysApply / trigger / mode)
  tool names and permissions: allowed-tools, tools: ['codebase'], Bash(...)
  model ids and model choices
  slash-command invocations and @rule-name references
  sandbox, approval and ignore settings (config.toml, settings.json)
  MCP server config
  "you are an expert..." persona lines — each tool has its own system prompt`,
      },
      {
        note: 'The layout that actually works: AGENTS.md is the real file, everything else points at it',
        lang: 'shell',
        code: `AGENTS.md                            <- the real content. Edit only this.
CLAUDE.md                            <- "Follow @AGENTS.md." + Claude-only bits
.github/copilot-instructions.md      <- "Follow AGENTS.md." + review checklist
.cursor/rules/always.mdc             <- alwaysApply: true, points at AGENTS.md
GEMINI.md                            <- not needed: set contextFileName instead

# Symlinks: fine for tools that read your working tree —
#     ln -s AGENTS.md CLAUDE.md                        (macOS/Linux)
#     New-Item -ItemType SymbolicLink CLAUDE.md -Target AGENTS.md   (Windows)
#   Claude Code, Codex CLI, Cursor and Zed all follow them.
#
# NOT fine for anything running on GitHub's servers (Copilot code review,
# the coding agent, Gemini Code Assist). A symlink is stored in git as a
# blob containing the target PATH, and following it is not documented
# behaviour. Commit a real file there.
#
# Real file, 3 lines, no drift worth worrying about:
#   .github/copilot-instructions.md
#     Follow the conventions in AGENTS.md at the repository root.
#     Review focus: flag new dependencies, missing tests, unhandled errors.
#     Do not comment on formatting; Prettier owns it.
#
# If the duplication still bothers you, generate the pointers from
# AGENTS.md in CI and fail the build when they drift.`,
      },
      {
        note: 'Which tool reads which, once you have done the above',
        lang: 'shell',
        code: `                       AGENTS.md  CLAUDE.md  copilot-instr.  .cursor/rules
Claude Code               yes*       yes          no              no
Codex CLI / GitHub        yes        no           no              no
Copilot editor            yes        no           yes             no
Copilot on github.com     yes        no           yes             no
Cursor                    yes        no           no              yes
Zed                       yes        yes          yes             yes (.cursorrules)
Gemini CLI                opt-in     no           no              no
Windsurf / Cline / Roo    no         no           no              no

# * run /memory to confirm for your version.
# Windsurf, Cline and Roo read none of the shared files — they need their
# own pointer file. One line each is enough.`,
      },
    ],
  },

  {
    title: 'Your own Markdown files on top',
    blurb:
      'The one rule that explains everything here: no tool reads a file you invented. A custom file is read only when an auto-loaded file names it, or when you @-mention it in chat. Everything else is convention among humans.',
    snippets: [
      {
        note: 'Three tiers, and what each one actually guarantees',
        lang: 'shell',
        code: `TIER 1 — real standards. GitHub itself does something with them.
  README.md                        rendered on the repo page
  LICENSE                          detected and shown
  CONTRIBUTING.md                  linked when opening a PR or issue
  SECURITY.md                      linked from the Security tab
  CODE_OF_CONDUCT.md               linked in the community profile
  .github/PULL_REQUEST_TEMPLATE.md prefills the PR body
  .github/ISSUE_TEMPLATE/*.md      the issue forms
  CHANGELOG.md                     convention only, but universal
  -> agents read these when they are pointed at them, and often anyway
     because README.md is the obvious first file.

TIER 2 — half-standard. Widely used names, no tool obligation.
  docs/architecture.md       docs/adr/0001-why-no-redux.md
  docs/testing.md            docs/runbooks/deploy.md
  docs/glossary.md           TODO.md        ROADMAP.md
  -> safe to assume a human knows the name. Safe to assume NO tool
     loads it. Reference it explicitly.

TIER 3 — yours. ai-notes.md, claude-context.md, my-rules.md.
  -> read by nothing, ever, unless named. A file called ai-context.md
     sitting in the root is invisible to every tool in this sheet.`,
      },
      {
        note: 'How to actually get a custom file read. Three mechanisms, and they are not interchangeable.',
        lang: 'yaml',
        code: `# 1. Imported — pulled in with the parent, EVERY request. Claude only.
# CLAUDE.md
@docs/architecture.md
@docs/testing.md
# Cost: both docs on every turn, forever. Use for short, load-bearing files.

# 2. Referenced — a plain mention. Works in every tool. The agent reads
#    the file only if it decides it needs to.
# AGENTS.md
Architecture and the reasons behind it: docs/architecture.md
Decision records: docs/adr/ — read the relevant one before changing a
public interface. Deploy steps: docs/runbooks/deploy.md
# Cost: one line per request. This is the default; prefer it.

# 3. Attached — you name it in the moment.
#    Claude Code / Copilot Chat / Cursor:  @docs/architecture.md
#    Cursor rule frontmatter can attach a file too: @db/schema.sql
# Cost: nothing until you use it.`,
      },
      {
        note: 'An ADR — the custom file with the best return, because it answers "why" and no code can',
        lang: 'yaml',
        code: `# docs/adr/0003-no-state-library.md

# 3. No state management library

Status: accepted
Date: 2026-03-14

## Context
State is one active tab, one scroll position per tab, a theme and a text
size. All of it fits in useState plus localStorage.

## Decision
No Redux, Zustand, Jotai or context-based store.

## Consequences
- Adding a store is a decision to revisit, not a refactor to slip into a PR.
- If App.tsx passes more than ~6 props deep, reopen this record.

# Then, in AGENTS.md, one line that makes it reachable:
#   Decisions and their reasons live in docs/adr/. No new dependency
#   without a record there.
#
# This is how you stop an agent "helpfully" installing Redux: the reason
# is written down and the instructions file points at it.`,
      },
    ],
  },

  {
    title: 'Writing them so they actually work',
    blurb:
      'Every one of these files has the same failure mode: prose that sounds like good advice and tells the model nothing it can act on. The fix is always the same — replace adjectives with commands, paths, and names.',
    snippets: [
      {
        note: 'Rewrite table. The left column is what most of these files look like.',
        lang: 'shell',
        code: `BAD                              GOOD
Write clean, maintainable code.  No function over 40 lines. No file over
                                 300. Extract to src/lib/ when either hits.
Follow best practices.           (delete the line — it costs tokens and
                                 changes nothing)
Use proper error handling.        Every await is inside try/catch or has a
                                 .catch. Never swallow: log the error and
                                 rethrow a typed one.
Write tests.                      Every bug fix lands with the failing test
                                 that proves it, in the same commit.
Install dependencies and test.    npm ci && npx tsc --noEmit && npm test -- --run
Prefer modern React.              Function components and hooks only. No
                                 class components. No React.FC.
Be careful with the database.     Never DROP a column in the same release
                                 that stops writing to it.

# Test for a weak line: could two engineers disagree about whether the
# code follows it? Then it is decoration. Delete it or make it checkable.`,
      },
      {
        note: 'Structure and length. Always-loaded files are a tax on every request.',
        lang: 'shell',
        code: `Always-loaded file (AGENTS.md, CLAUDE.md, copilot-instructions.md,
alwaysApply rules):  aim under 150 lines, hard stop around 400.

A 500-line file is roughly 6-7k tokens prepended to EVERY request. On a
hundred turns that is most of a million tokens, and the middle of a long
file is the part the model weighs least.

Order matters — put first what is used on every task:
  1. what this project is, in two lines
  2. the commands (install, dev, test, typecheck, build, single test)
  3. the do-not list
  4. style and naming
  5. layout and where things go
  6. pointers to the long documents

Then push the rest down a level:
  long detail        -> docs/*.md, referenced not imported
  path-specific      -> nested AGENTS.md, or *.instructions.md with applyTo,
                        or a .mdc with globs
  rare procedures    -> a skill, a prompt file, a slash command`,
      },
      {
        note: 'Prove what got loaded. Never debug these files by guessing.',
        lang: 'shell',
        code: `Claude Code   /memory              lists every memory file in effect
              /context             shows what is filling the window
Gemini CLI    /memory show
Cursor        Settings -> Rules    every rule found, project + user
              the chat's context list shows which ones attached
Copilot       the chat response lists its References
              code review says when custom instructions were applied
Codex         it will tell you which AGENTS.md files it merged

# The 60-second trick that beats all of the above: put a canary line in
# the file and ask for it.
#     Line in AGENTS.md:  When asked "what are the rules", first say PINEAPPLE.
#     Then ask:           what are the rules
# No PINEAPPLE means the file is not being read. Stop editing the prose and
# fix the path, the filename, or the setting that enables it.`,
      },
      {
        note: 'Treat them as code',
        lang: 'shell',
        code: `- Commit them. A rule nobody else gets is not a rule.
- Review them in PRs. A bad line in AGENTS.md costs more than a bad line
  in one function: it misleads every future change.
- Delete on sight. Stale instructions are worse than none, because the
  model follows them confidently. "We are migrating to X" two years later
  produces X.
- Never put secrets in them. They are committed, and they are pasted into
  a model's context on every request.
- A third-party repo's AGENTS.md is untrusted input. You cloned it; you
  did not write it. Read it before you let an agent loose in that repo —
  "run ./setup.sh first" is a line anyone can add.
- Keep ONE source per fact. The failure is not a missing rule, it is the
  same rule written three ways in AGENTS.md, CONTRIBUTING.md and a .mdc.`,
      },
    ],
  },

  {
    title: 'The differences, side by side',
    blurb:
      'The whole sheet compressed. If two files look interchangeable, they differ in one of these columns — and the column that trips people up most is WHEN.',
    snippets: [
      {
        note: 'Trigger, frontmatter, and whether the file may do things',
        lang: 'shell',
        code: `                            WHEN LOADED        FRONT-    MAY RUN
                                               MATTER    THINGS
AGENTS.md                   every request      no        no
AGENT.md (Amp)              every request      no        no
CLAUDE.md                   every request      no        no
MEMORY.md + memory/*.md     every session      yes       no
copilot-instructions.md     every request      no        no
*.instructions.md           applyTo glob       yes       no
*.prompt.md                 you type /name     optional  yes
*.chatmode.md               you pick the mode  yes       yes
.cursor/rules/*.mdc         you choose: always / glob /  yes       no
                            model decides / @name
.cursorrules                every request      no        no
SKILL.md                    model decides,     yes       yes
                            from description
.claude/agents/*.md         model delegates,   yes       yes
                            or you ask
.claude/commands/*.md       you type /name     optional  yes
GEMINI.md                   every request      no        no
.gemini/styleguide.md       PR review only     no        no
.windsurf/rules/*.md        per-file trigger:  yes       no
                            always_on / glob / model_decision / manual
.clinerules/*.md            every request      no        no
.roo/rules-<mode>/*.md      in that mode       no        no
.rules (Zed)                every request      no        no
CONVENTIONS.md              only with --read   no        no
docs/anything.md            only when named    no        no`,
      },
      {
        note: 'Scope and sharing — who else gets this rule',
        lang: 'shell',
        code: `                               IN GIT   TEAM SEES IT   SCOPE
AGENTS.md (root)               yes      yes            whole repo
AGENTS.md (nested)             yes      yes            that subtree
CLAUDE.md (project)            yes      yes            whole repo
CLAUDE.md (~/.claude)          no       no             all your projects
auto-memory MEMORY.md          no       no             one project, you
CLAUDE.md (enterprise path)    no       everyone,      every repo on the
                                        by policy      managed machine
copilot-instructions.md        yes      yes            whole repo
*.instructions.md              yes      yes            matching paths
.cursor/rules/*.mdc            yes      yes            per the frontmatter
Cursor User Rules              no       no             all your projects
settings.json instructions     if .vscode/ committed   that workspace
.gemini/config.yaml            yes      yes            PR reviews
Project instructions (web UI)  no       Project members that Project

# Two people getting different behaviour from the same repo is almost
# always a global file: ~/.claude/CLAUDE.md, ~/.codex/AGENTS.md, Cursor
# User Rules, or an editor setting. None of them are in git, so nobody
# can see them but their owner.`,
      },
    ],
  },

  {
    title: 'Common mistakes with AI config files',
    blurb: 'In rough order of how often they waste an afternoon.',
    snippets: [
      {
        note: 'Wrong place, wrong name',
        lang: 'shell',
        code: `copilot-instructions.md  in the repo root        -> .github/ only
.github/AGENTS.md                                 -> repo ROOT
AGENT.md expecting Copilot or Codex to read it    -> Amp only
agents.md / AGENTS.MD on a case-sensitive host    -> exact case: AGENTS.md
.cursor/rules/x.md                                -> must be .mdc
.github/instructions/x.md                         -> must be .instructions.md
.claude/skills/my-skill.md                        -> skills/my-skill/SKILL.md
.claude/skill/... or .claude/command/...           -> plural: skills, commands
A rules file inside .gitignore                    -> nobody else ever gets it`,
      },
      {
        note: 'Right file, wrong expectations',
        lang: 'shell',
        code: `- Expecting Copilot's PR review to honour .cursorrules or CLAUDE.md.
  It reads copilot-instructions.md, *.instructions.md and AGENTS.md. Full stop.
- Expecting a prompt file or chat mode to apply automatically. Both are
  invoked by hand. Automatic behaviour needs an instructions file.
- Writing an "agent requested" Cursor rule with no description. The model
  only sees the description; with none, the rule never fires.
- A SKILL.md description that is a title ("Testing helper"). It never
  triggers. Write what it does AND when to use it.
- A 900-line CLAUDE.md with the important rule on line 600.
- Symlinking .github/copilot-instructions.md to AGENTS.md and expecting
  GitHub's servers to follow it.
- Forgetting the VS Code setting: useInstructionFiles must be true, or the
  editor ignores the file that github.com happily uses.
- An agent that installs a banned dependency: the ban was in a doc nothing
  loads, not in the always-loaded file.`,
      },
      {
        note: 'Content mistakes',
        lang: 'shell',
        code: `- A persona ("You are a 10x engineer") instead of facts about the repo.
- Rules the tool cannot verify: "always write performant code".
- Contradictions across files — root AGENTS.md says npm, the nested one
  says pnpm, CONTRIBUTING.md says yarn. You get a coin flip per request.
- Duplicating the README. Point at it instead; it is already there.
- Stale commands. The single highest-value line in any of these files is
  the test command, and it is the first one to rot. Run every command in
  your AGENTS.md before you commit it.
- API keys, internal hostnames, customer names. These files are committed
  and go into a model's context on every request.
- Never revisiting them. Diff AGENTS.md against reality once a quarter;
  about a third of it is usually wrong by then.`,
      },
    ],
  },
]

export default aiConfigFiles

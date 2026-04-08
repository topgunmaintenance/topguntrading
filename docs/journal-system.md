# Journal System

The journal is the heart of TopGun Trading. If a trader uses nothing else,
they should use the journal. It is designed to be opened in two seconds,
written in thirty, and reviewed in five minutes.

## Goals

1. Frictionless capture from any surface (chart, watchlist, replay,
   extension).
2. Rich context: every entry can carry symbol, timeframe, bar range,
   chart screenshot, linked trade, linked rules, tags.
3. Searchable, taggable, exportable.
4. AI-readable: structured enough that the AI copilot can answer
   questions across the journal.
5. User-owned: full export at any time.

## Entry shape

```ts
interface JournalEntry {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  mode: "live" | "replay";
  text: string;             // markdown
  tags: string[];
  symbol?: string;
  timeframe?: string;
  barRange?: { from: number; to: number };
  attachments: Attachment[];
  linkedTradeId?: string;
  linkedRuleEvaluationIds: string[];
  source: "web" | "extension" | "replay" | "api";
  provenance?: {
    url?: string;
    title?: string;
    detectedTickers?: string[];
  };
}
```

## Capture surfaces

- **Chart drawer** — `J` from any chart opens a drawer pre-filled with
  symbol, timeframe, and current bar range.
- **Replay drawer** — same as chart drawer, but tagged `mode: replay`.
- **Trade form** — when logging a trade, the user can attach or create
  a journal entry.
- **Extension** — quick capture from any web page; provenance is
  captured automatically.
- **API** — for power users and tooling.

## Templates

- Pre-trade plan
- Post-trade review
- Daily plan
- Daily review
- Pattern study
- Mistake log
- Lesson learned

Templates live in user settings and can be customized.

## Tags

- User-defined, free-form, lowercased on save.
- Tag autocompletion uses the user's prior tags first.
- Special tags: `mistake`, `lesson`, `setup:<name>`, `mood:<state>`.

## Search

- Full-text over `text` and `tags`.
- Filters: date range, tag, symbol, mode (live / replay), linked-trade
  presence, source.
- Search is server-side; the client never downloads the full corpus.

## Export

- JSON export of all entries with attachments references.
- Markdown export per entry.
- CSV export of trade-linked entries for evaluation programs.

## AI integration

- Journal Q&A is grounded only on the user's own entries.
- Entries are chunked and embedded; embeddings are stored alongside the
  entry id.
- The AI surface always cites the entry ids it used.
- See [`docs/ai-strategy.md`](ai-strategy.md).

## Privacy

- Journal contents are private to the user by default.
- Sharing (read-only links, mentor sharing) is a later phase and must be
  explicit per entry.

## Open decisions

Tracked in [`docs/decisions.md`](decisions.md):

- Whether to support voice notes in Phase 4 or defer
- Whether to use a vector store in Postgres (`pgvector`) or external

<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## App architecture
- Keep the journey's shared state in a root-mounted React provider, without browser or database persistence, so navigation preserves a session without saving career materials.
- Run evidence analysis through a public, input-validated TanStack server function and the Lovable AI Gateway; no account is required for this MVP.
- Extract document text in browser event handlers with dynamically imported parsers, so files are not stored and parser globals do not execute during SSR.
- Validate every Supported quote against its exact source before displaying analysis, so unsupported generated claims cannot receive a Supported label.
- Keep discovered capabilities separate from target bridge results and invalidate bridges when selections or direction change, so every displayed translation matches the current choices.
- Explore the Possibilities matches against the imported O*NET catalog (public read-only tables, pgvector embeddings) and shows occupations, never job openings; AI only ranks and explains retrieved records, and validateMatches drops any code, title or responsibility not in those records, so every suggestion is a real database entry.
- Load O*NET releases with the service key over the Data API (sandbox psql cannot write); record each release and its counts in onet_releases.
- Apply user corrections (skill name or description, source-text edits, added context, interview answers) to the already-grounded analysis state and re-validate evidence there, so editing never routes through the AI model or invents new claims.

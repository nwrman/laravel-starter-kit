# The private folder

`private/` at the repo root holds this Product's quotes, prices and hours. It is in `.gitignore` and is never pushed,
so its only backup is the Mac's (Time Machine), and `git clean -x` deletes it.

- Read and write it freely: proposals and quotes are drafted there.
- **No amount ever leaves it.** No price, rate, hour count or total goes into an issue, a comment, a commit, a PR or a
  ticket. A pricing ticket records scope and line items and points to the file in `private/`.
- Never `git add -f` anything under `private/`, and never remove `/private` from `.gitignore`.

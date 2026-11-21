---
name: commit-changes
description: Create local Git commits when the user says "commit this", "commit the changes", "save this in git", or equivalent. Review the requested diff, follow repository standards and recent message style, validate relevant changes, and execute the commit. Do not trigger for commit-message suggestions or hypothetical discussions about committing.
---

# Commit changes

Turn an explicit request to commit completed work into an actual local Git commit. The request authorizes ordinary staging and commit steps: do not stop after proposing a message or ask for the same authorization again. Merely implementing a change does not authorize a commit. Creating this skill, discussing future commits, or asking for a message does not authorize one either.

## Establish scope and conventions

- Read applicable `AGENTS.md` and development/commit standards. In TGE, read `TGE Project Docs/TGE Development Standards.docx`; extract its text without changing it. Reuse a current complete reading from this session if the document has not changed.
- Inspect `git status --short --branch`, the last five commit subjects, staged changes, and relevant unstaged/untracked changes. Existing staged files are not automatically part of the request.
- Infer scope from the current task and explicit file instructions. Include its code, tests and documentation; preserve unrelated edits. Ask a scope question only when an actual ambiguity prevents selecting the right changes.
- Follow branch rules. When task branches are required, do not commit directly to protected `main` or `develop`. Continue on an appropriate task branch or create a compliant one without discarding work. Use known ticket identifiers; never invent them. Ask only if a required identifier cannot be established. Do not fetch, pull, rebase or alter history merely to create a local commit.

## Review and validate

- Inspect the actual requested diff, including deletions and untracked additions. Check unintended generated files, dependency changes, runtime logs, editor/Word lock files such as `~$*.docx`, and unrelated documents.
- Exclude real environment files (including `.ENV`), passwords, keys, tokens and sensitive logs. Safe example configuration may be included after review. Do not print candidate secret values into chat or command output. Resolve affected commit scope without automatically rotating credentials or rewriting history.
- Run relevant checks required by repository policy. Reuse recent passing results when they still cover the exact changes. Run `git diff --check` and review staged whitespace as applicable. Do not create tests solely for trivial documentation edits or expand into unrelated testing.
- Use an authorized disposable database for data-writing tests. A commit request does not authorize migrations or production access. Accurately report checks that could not run.
- Address relevant check failures within scope. Do not silently bypass required checks, hooks, signing or branch rules. If a required failure needs a user decision, explain the specific blocker and ask only that question. Do not call unverified changes production-ready.

## Make the commit

- Use concise Conventional Commit subjects when required, matching recent style: `feat(scope): ...`, `fix(scope): ...`, `refactor(scope): ...`, `chore(scope): ...`, or `test(scope): ...`. Describe the resulting behavior. Preserve a user-supplied message unless it conflicts with an applicable rule; resolve the specific conflict. Do not invent ticket IDs or passing check results.
- Follow grouping rules. TGE requires separate test-only commits from implementation changes; create that small logical sequence when appropriate. Keep related documentation with the work it explains unless policy says otherwise.
- Stage explicit paths or reviewed hunks, including additions, deletions and renames. Do not use blanket `git add .` or `git add -A` to collect a mixed working tree. Preserve unrelated staged entries. For overlapping changes in the same file, isolate the requested hunks or clarify scope rather than committing the whole file.
- Review the exact commit scope immediately before committing. Ensure unrelated staged entries cannot enter it; use explicit commit paths or another index-preserving approach when needed. Never unstage, discard or overwrite another task's edits just to simplify staging.
- Execute `git commit` with the chosen message. Avoid shell interpolation of message text: use safe quoting, structured arguments, or a UTF-8 message file with `git commit -F` for multiline content. On Windows use native PowerShell path handling.
- Inspect the result and final Git status. If a hook changes files, review them and rerun affected checks before retrying. A failed commit is not complete. If there are no relevant changes, report that without creating an empty commit.

Commit authorization does not include pushing, opening/merging PRs, deployment, deleting branches, amending existing commits, force pushes or history rewrites. Perform those only with separate session authorization. Respect execution permissions; report a rejected operation and its reason instead of bypassing it.

## Report the result

Return each short commit hash and subject, a compact validation summary, and relevant remaining changes or blockers. State whether a push happened when relevant. Do not claim a clean working tree if unrelated changes remain.

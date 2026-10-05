# Agent workflow

How agents work in this repository.

<!-- thrifty:project-workflow:begin (generated from thrifty.project.yml; do not edit) -->
## Branch, commit, and PR naming

**Default branch:** `master` — PRs target `master`.

| Rule | Pattern | Example |
|---|---|---|
| Ticket branch | `{agent}/{ticket_lower}-{number}-{slug}` | `claude/htpc-42-add-water-profile` |
| Misc branch | `{agent}/misc-{slug}` | `claude/misc-add-water-profile` |
| Ticket commit | `{type}({ticket_upper}-{number}): {description}` | `feat(HTPC-42): add the water profile calculator` |
| Misc commit | `{type}(MISC): {description}` | `feat(MISC): add the water profile calculator` |
| Ticket PR title | `{ticket_upper}-{number}: {title}` | `HTPC-42: Add the water profile calculator` |
| Misc PR title | `MISC: {title}` | `MISC: Add the water profile calculator` |

**Current native ticket key:** `HTPC` — `lowercase` in branches, `uppercase` in commits and PR titles.

**Agents:** `claude`, `cursor`, `codex`, `junie`

**Commit types:** `feat`, `fix`, `chore`, `refactor`, `docs`, `test`

**Reserved for Thrifty's own maintenance:** branch `chore/thrifty-maintenance`, with commit subject and PR title `chore(THRIFTY): {description}` (e.g. `chore(THRIFTY): thrifty update - refresh managed skills`). Thrifty writes these itself when it opens its maintenance pull request. `THRIFTY` is not a ticket key: never use this branch, scope, or any variation of them for your own work — use the ticket or misc rules above.

These rules are generated from `thrifty.project.yml`. Edit that file, not this block — everything outside these markers is yours.
<!-- thrifty:project-workflow:end -->

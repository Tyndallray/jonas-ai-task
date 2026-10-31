# Project conventions

## Git

- All commits follow [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): subject`
  - Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `style`, `revert`
  - Subject in imperative mood, lowercase, no trailing period; mark breaking changes with `!` or a `BREAKING CHANGE:` footer
- Branches: only two long-lived branches, `dev` and `prod`
  - All work is committed to (or merged into) `dev`
  - `prod` is updated only by merging `dev`; never commit directly to `prod`

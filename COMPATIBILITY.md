# Toolchain Compatibility Decision

## Decision

Use TypeScript 6.0.3 and ESLint 9.39.1 with Next.js 16.2.10.

## Verification evidence

The initial scaffold tested TypeScript 7.0.2 and ESLint 10.7.0. The installed Next.js lint
toolchain failed at runtime in `@typescript-eslint/typescript-estree` and `eslint-plugin-react`.
The failures occurred before application lint rules could run.

The repository was therefore pinned to the newest stable compatible lines verified here:

- TypeScript 6.0.3
- ESLint 9.39.1

With those versions, formatting, linting, type checking, seven unit tests, and the Next.js
production build complete successfully. Upgrade only after the Next.js lint dependency chain
explicitly supports TypeScript 7 and ESLint 10 and the full verification gate passes.

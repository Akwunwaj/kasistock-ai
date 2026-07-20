# KasiStock AI evaluations

The Build Week release includes a labelled product-identity dataset at
`evals/product-matching-cases.json`.

Run the evaluation gate with:

```powershell
npm run evals
```

The scorer measures:

- canonical-product accuracy;
- authority-state accuracy;
- unsafe automatic merges;
- total cases that satisfy both identity and authority expectations.

A release is blocked if any incorrect product is automatically confirmed. GPT-assisted
matching remains outside this deterministic baseline and requires explicit human confirmation.

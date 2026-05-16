# Feature 7: Synthetic Test Data Generator
Phase: 3 | Pipeline: Generator with fast_format model

## What it does
Generates realistic, structured test data based on project context. Uses `@faker-js/faker` as the factory for locale-aware values + GROQ for intelligent field mapping from ScreenElementMaps.

## Key files
- `src/app/api/generate/test-data/route.ts`
- `src/lib/schemas/test-data.ts` — TestDataOutputSchema (see SCHEMA.md)
- `src/components/features/TestDataPage.tsx`
- `src/components/generation/TestDataTable.tsx` — tabular output with copy/download

## Inputs
| Input | Required |
|---|---|
| Form fields from ScreenElementMaps | Yes (auto-detected from screenshots) |
| Data count (rows) | No (default: 10) |
| Locale | No (default: en-US) |
| Edge case ratio | No (default: 20% edge case rows) |

## How it works
1. **Field mapping:** GROQ identifies form fields from ScreenElementMaps (email, phone, date, etc.)
2. **Faker factory:** Maps AI field types → Faker.js generators:
   ```
   email → faker.internet.email()
   phone → faker.phone.number()
   name  → faker.person.fullName()
   date  → faker.date.recent()
   price → faker.commerce.price()
   ```
3. **Edge case injection:** 20% of rows include boundary values (empty strings, very long text, special chars, SQL injection patterns, Unicode)

## Output format
JSON array of objects + downloadable as CSV:
```json
[
  { "email": "user@example.com", "name": "Jane Smith", "age": 28 },
  { "email": "", "name": "A".repeat(256), "age": -1 }  ← edge case row
]
```

## Dependencies
```bash
npm install @faker-js/faker
```

## Gotchas
- `fast_format` model (llama-3.1-8b) is used — fast but less accurate field detection
- If no screenshots available, prompt user to describe form fields manually
- Edge case rows must be visually marked in the table (different row background)

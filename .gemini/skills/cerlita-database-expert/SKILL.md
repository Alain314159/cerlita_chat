---
name: cerlita-database-expert
description: Supabase database and RLS policies expert. Use when modifying database schemas, writing RLS policies, creating Postgres functions, or debugging database performance.
---

# Cerlita Database Expert

This skill governs the best practices for managing the Supabase PostgreSQL database in the Cerlita Chat project.

## Core Directives

1. **Schema Modifications:** All schema changes must be added to `database_schema.sql` (or a dedicated migration file). Never apply changes directly without tracking them.
2. **Row Level Security (RLS):** Every table must have RLS enabled. Policies must be strict, verifying `auth.uid()` against ownership or participant arrays. 
   - **Optimization:** Prefer checking against junction tables (like `chat_participants`) rather than arrays when queries are complex, to take advantage of indexes.
3. **Functions & Triggers:** Use `SECURITY DEFINER` sparingly and always include explicit authorization checks within the function body to prevent abuse.
4. **Data Redundancy:** Avoid duplicating data. Use foreign keys with `ON DELETE CASCADE` where appropriate.

## Workflow for Schema Changes

1. Analyze the required data structure.
2. Formulate the `CREATE TABLE` or `ALTER TABLE` statements.
3. Define strict RLS policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
4. Update or create corresponding TypeScript types in `src/types/database.types.ts` to reflect the new schema.
5. Apply the changes safely.

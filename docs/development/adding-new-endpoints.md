# Guide: Adding New API Endpoints

This guide explains how to add new API endpoints following the established patterns in the codebase.

## Architecture Overview

Our API follows a layered architecture:

```
API Endpoint → Validation Schema → Service Layer → Database
```

## Step-by-Step Guide

### 1. Define Types (if needed)

Add new types to `src/types.ts`:

```typescript
// DTO for API responses
export type MyEntityDTO = Pick<
  Tables<'my_entities'>,
  'id' | 'name' | 'created_at'
>;

// Command for creating entity
export type CreateMyEntityCommand = Pick<
  TablesInsert<'my_entities'>,
  'name'
>;

// Query parameters
export type MyEntitiesListQuery = {
  page?: number;
  page_size?: number;
};
```

### 2. Create Validation Schemas

Create `src/lib/validation/my-entity.schema.ts`:

```typescript
import { z } from 'zod';

export const CreateMyEntitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'name must not be empty')
    .max(100, 'name must not exceed 100 characters'),
});

export const MyEntitiesListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1)),
  page_size: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
});

export const IdParamSchema = z.string().uuid('ID must be a valid UUID');
```

### 3. Create Service Layer

Create `src/lib/services/my-entity.service.ts`:

```typescript
import type { SupabaseClient } from '@/db/supabase.client';
import type { CreateMyEntityCommand, MyEntityDTO } from '@/types';

export class MyEntityServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'MyEntityServiceError';
  }
}

export async function create(
  supabase: SupabaseClient,
  command: CreateMyEntityCommand,
  userId: string
): Promise<MyEntityDTO> {
  const { data, error } = await supabase
    .from('my_entities')
    .insert({
      user_id: userId,
      name: command.name,
    })
    .select('id, name, created_at')
    .single();

  if (error || !data) {
    console.error('Entity creation error:', error);
    throw new MyEntityServiceError(
      'Failed to create entity',
      'DATABASE_ERROR',
      500
    );
  }

  return data as MyEntityDTO;
}

export async function list(
  supabase: SupabaseClient,
  query: MyEntitiesListQuery
): Promise<{ items: MyEntityDTO[]; total: number }> {
  const page = query.page || 1;
  const pageSize = query.page_size || 20;
  const offset = (page - 1) * pageSize;

  const { data, error, count } = await supabase
    .from('my_entities')
    .select('id, name, created_at', { count: 'exact' })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Entity list error:', error);
    throw new MyEntityServiceError(
      'Failed to fetch entities',
      'DATABASE_ERROR',
      500
    );
  }

  return {
    items: (data || []) as MyEntityDTO[],
    total: count || 0,
  };
}
```

### 4. Create API Endpoints

Create `src/pages/api/my-entities/index.ts`:

```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';

import { CreateMyEntitySchema, MyEntitiesListQuerySchema } from '@/lib/validation/my-entity.schema';
import { create, list, MyEntityServiceError } from '@/lib/services/my-entity.service';

export const prerender = false;

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

export const POST: APIRoute = async (context) => {
  // 1. Authentication check
  if (!context.locals.user) {
    return json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    );
  }

  // 2. Parse request body
  let requestBody: unknown;
  try {
    requestBody = await context.request.json();
  } catch (error) {
    return json(
      { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
      { status: 400 }
    );
  }

  // 3. Validate and process
  try {
    const validatedData = CreateMyEntitySchema.parse(requestBody);
    const result = await create(
      context.locals.supabase,
      validatedData,
      context.locals.user.id
    );

    return json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        {
          error: 'Validation error',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    if (error instanceof MyEntityServiceError) {
      return json(
        { error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error('Unexpected error:', error);
    return json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
};

export const GET: APIRoute = async (context) => {
  if (!context.locals.user) {
    return json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    );
  }

  const url = new URL(context.request.url);
  const queryParams = {
    page: url.searchParams.get('page') || undefined,
    page_size: url.searchParams.get('page_size') || undefined,
  };

  try {
    const validatedQuery = MyEntitiesListQuerySchema.parse(queryParams);
    const result = await list(context.locals.supabase, validatedQuery);

    return json(result, { status: 200 });
  } catch (error) {
    // ... error handling (same as POST)
  }
};
```

Create `src/pages/api/my-entities/[id].ts` for GET/PUT/DELETE operations following the same pattern.

### 5. Write Tests

Create `src/lib/validation/__tests__/my-entity.schema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { CreateMyEntitySchema } from '../my-entity.schema';

describe('CreateMyEntitySchema', () => {
  it('accepts valid input', () => {
    const result = CreateMyEntitySchema.safeParse({
      name: 'Test Entity',
    });

    expect(result.success).toBe(true);
  });

  it('trims whitespace', () => {
    const result = CreateMyEntitySchema.safeParse({
      name: '  Test  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test');
    }
  });

  it('rejects empty name', () => {
    const result = CreateMyEntitySchema.safeParse({
      name: '   ',
    });

    expect(result.success).toBe(false);
  });
});
```

Run tests:
```bash
npm test -- my-entity.schema.test.ts
```

### 6. Document the API

Create `docs/api/my-entities.md` following the pattern in `docs/api/flashcards.md`.

## Best Practices

### ✅ DO

1. **Always validate input** using Zod schemas
2. **Use service layer** for business logic
3. **Handle errors properly** with appropriate HTTP status codes
4. **Write tests** for all validation schemas
5. **Document endpoints** with examples
6. **Use TypeScript types** from `src/types.ts`
7. **Leverage RLS** for authorization
8. **Trim text inputs** before validation
9. **Use custom error classes** for service errors
10. **Export `prerender = false`** for API routes

### ❌ DON'T

1. **Don't put business logic in endpoints** - use service layer
2. **Don't skip validation** - always validate input
3. **Don't expose internal errors** - return user-friendly messages
4. **Don't use `any` types** - use proper TypeScript types
5. **Don't forget authentication checks** - always verify `context.locals.user`
6. **Don't hardcode values** - use constants or environment variables
7. **Don't skip tests** - write tests for all new code
8. **Don't bypass RLS** - use the Supabase client from context

## Common Patterns

### Authentication Check
```typescript
if (!context.locals.user) {
  return json(
    { error: 'Unauthorized', message: 'Authentication required' },
    { status: 401 }
  );
}
```

### Error Handling
```typescript
try {
  // ... operation
} catch (error) {
  if (error instanceof z.ZodError) {
    return json({ error: 'Validation error', details: error.errors }, { status: 400 });
  }
  if (error instanceof MyServiceError) {
    return json({ error: error.code, message: error.message }, { status: error.statusCode });
  }
  console.error('Unexpected error:', error);
  return json({ error: 'Internal server error' }, { status: 500 });
}
```

### Pagination
```typescript
const page = query.page || 1;
const pageSize = query.page_size || 20;
const offset = (page - 1) * pageSize;

const { data, count } = await supabase
  .from('table')
  .select('*', { count: 'exact' })
  .range(offset, offset + pageSize - 1);
```

### Query Parameter Transformation
```typescript
export const QuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1)),
});
```

## Testing Checklist

- [ ] Schema validation tests (valid input, invalid input, edge cases)
- [ ] Service layer tests (success cases, error cases)
- [ ] Integration tests (optional, for complex flows)
- [ ] TypeScript compilation (`npx tsc --noEmit`)
- [ ] All tests passing (`npm test`)
- [ ] Build succeeds (`npm run build`)

## Example: Flashcards API

For a complete reference implementation, see:
- Schemas: `src/lib/validation/flashcards.schema.ts`
- Service: `src/lib/services/flashcard.service.ts`
- Endpoints: `src/pages/api/flashcards/`
- Tests: `src/lib/validation/__tests__/flashcards.schema.test.ts`
- Documentation: `docs/api/flashcards.md`

## Resources

- [Astro API Routes](https://docs.astro.build/en/core-concepts/endpoints/)
- [Zod Documentation](https://zod.dev/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Vitest Documentation](https://vitest.dev/)


/**
 * Unit tests for Flashcard validation schemas
 *
 * Tests cover:
 * - CreateFlashcardSchema validation rules
 * - CreateFlashcardsBatchSchema validation rules
 * - UpdateFlashcardSchema validation rules
 * - FlashcardsListQuerySchema validation rules
 * - IdParamSchema validation rules
 * - Edge cases and boundary conditions
 */

import { describe, it, expect } from "vitest";
import {
  CreateFlashcardSchema,
  CreateFlashcardsBatchSchema,
  UpdateFlashcardSchema,
  FlashcardsListQuerySchema,
  IdParamSchema,
} from "../flashcards.schema";

describe("CreateFlashcardSchema", () => {
  describe("front_text validation", () => {
    it("accepts valid front_text (1-1000 chars)", () => {
      const result = CreateFlashcardSchema.safeParse({
        front_text: "What is TypeScript?",
        back_text: "A typed superset of JavaScript",
      });

      expect(result.success).toBe(true);
    });

    it("trims whitespace from front_text", () => {
      const result = CreateFlashcardSchema.safeParse({
        front_text: "  What is TypeScript?  ",
        back_text: "A typed superset of JavaScript",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.front_text).toBe("What is TypeScript?");
      }
    });

    it("rejects empty front_text after trim", () => {
      const result = CreateFlashcardSchema.safeParse({
        front_text: "   ",
        back_text: "Answer",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("must not be empty");
      }
    });

    it("rejects front_text exceeding 1000 chars", () => {
      const result = CreateFlashcardSchema.safeParse({
        front_text: "a".repeat(1001),
        back_text: "Answer",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("must not exceed 1000 characters");
      }
    });

    it("accepts front_text at exactly 1000 chars", () => {
      const result = CreateFlashcardSchema.safeParse({
        front_text: "a".repeat(1000),
        back_text: "Answer",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("back_text validation", () => {
    it("accepts valid back_text (1-1000 chars)", () => {
      const result = CreateFlashcardSchema.safeParse({
        front_text: "Question",
        back_text: "A typed superset of JavaScript",
      });

      expect(result.success).toBe(true);
    });

    it("trims whitespace from back_text", () => {
      const result = CreateFlashcardSchema.safeParse({
        front_text: "Question",
        back_text: "  Answer  ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.back_text).toBe("Answer");
      }
    });

    it("rejects empty back_text after trim", () => {
      const result = CreateFlashcardSchema.safeParse({
        front_text: "Question",
        back_text: "   ",
      });

      expect(result.success).toBe(false);
    });

    it("rejects back_text exceeding 1000 chars", () => {
      const result = CreateFlashcardSchema.safeParse({
        front_text: "Question",
        back_text: "a".repeat(1001),
      });

      expect(result.success).toBe(false);
    });
  });

  describe("origin validation", () => {
    it("accepts valid origin values", () => {
      const origins = ["manual", "AI_full", "AI_edited"] as const;

      origins.forEach((origin) => {
        const result = CreateFlashcardSchema.safeParse({
          front_text: "Question",
          back_text: "Answer",
          origin,
        });

        expect(result.success).toBe(true);
      });
    });

    it("rejects invalid origin values", () => {
      const result = CreateFlashcardSchema.safeParse({
        front_text: "Question",
        back_text: "Answer",
        origin: "invalid",
      });

      expect(result.success).toBe(false);
    });

    it("allows origin to be omitted", () => {
      const result = CreateFlashcardSchema.safeParse({
        front_text: "Question",
        back_text: "Answer",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("generation_session_id validation", () => {
    it("accepts valid UUID", () => {
      const result = CreateFlashcardSchema.safeParse({
        front_text: "Question",
        back_text: "Answer",
        generation_session_id: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.success).toBe(true);
    });

    it("rejects invalid UUID format", () => {
      const result = CreateFlashcardSchema.safeParse({
        front_text: "Question",
        back_text: "Answer",
        generation_session_id: "not-a-uuid",
      });

      expect(result.success).toBe(false);
    });

    it("allows generation_session_id to be null", () => {
      const result = CreateFlashcardSchema.safeParse({
        front_text: "Question",
        back_text: "Answer",
        generation_session_id: null,
      });

      expect(result.success).toBe(true);
    });

    it("allows generation_session_id to be omitted", () => {
      const result = CreateFlashcardSchema.safeParse({
        front_text: "Question",
        back_text: "Answer",
      });

      expect(result.success).toBe(true);
    });
  });
});

describe("CreateFlashcardsBatchSchema", () => {
  it("accepts valid batch (1-20 items)", () => {
    const batch = Array.from({ length: 10 }, (_, i) => ({
      front_text: `Question ${i}`,
      back_text: `Answer ${i}`,
    }));

    const result = CreateFlashcardsBatchSchema.safeParse(batch);

    expect(result.success).toBe(true);
  });

  it("accepts batch with exactly 1 item", () => {
    const result = CreateFlashcardsBatchSchema.safeParse([{ front_text: "Question", back_text: "Answer" }]);

    expect(result.success).toBe(true);
  });

  it("accepts batch with exactly 20 items", () => {
    const batch = Array.from({ length: 20 }, (_, i) => ({
      front_text: `Question ${i}`,
      back_text: `Answer ${i}`,
    }));

    const result = CreateFlashcardsBatchSchema.safeParse(batch);

    expect(result.success).toBe(true);
  });

  it("rejects empty batch", () => {
    const result = CreateFlashcardsBatchSchema.safeParse([]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("at least 1");
    }
  });

  it("rejects batch exceeding 20 items", () => {
    const batch = Array.from({ length: 21 }, (_, i) => ({
      front_text: `Question ${i}`,
      back_text: `Answer ${i}`,
    }));

    const result = CreateFlashcardsBatchSchema.safeParse(batch);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("must not exceed 20");
    }
  });

  it("validates each item in batch", () => {
    const batch = [
      { front_text: "Valid", back_text: "Valid" },
      { front_text: "", back_text: "Invalid" }, // Invalid: empty front_text
    ];

    const result = CreateFlashcardsBatchSchema.safeParse(batch);

    expect(result.success).toBe(false);
  });
});

describe("UpdateFlashcardSchema", () => {
  it("accepts update with front_text only", () => {
    const result = UpdateFlashcardSchema.safeParse({
      front_text: "Updated question",
    });

    expect(result.success).toBe(true);
  });

  it("accepts update with back_text only", () => {
    const result = UpdateFlashcardSchema.safeParse({
      back_text: "Updated answer",
    });

    expect(result.success).toBe(true);
  });

  it("accepts update with both fields", () => {
    const result = UpdateFlashcardSchema.safeParse({
      front_text: "Updated question",
      back_text: "Updated answer",
    });

    expect(result.success).toBe(true);
  });

  it("rejects update with no fields", () => {
    const result = UpdateFlashcardSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("At least one field");
    }
  });

  it("trims whitespace from fields", () => {
    const result = UpdateFlashcardSchema.safeParse({
      front_text: "  Updated  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.front_text).toBe("Updated");
    }
  });

  it("rejects empty fields after trim", () => {
    const result = UpdateFlashcardSchema.safeParse({
      front_text: "   ",
    });

    expect(result.success).toBe(false);
  });
});

describe("FlashcardsListQuerySchema", () => {
  it("accepts valid query with all parameters", () => {
    const result = FlashcardsListQuerySchema.safeParse({
      page: "2",
      page_size: "50",
      q: "typescript",
      origin: "AI_full",
      sort: "created_at_desc",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.page_size).toBe(50);
    }
  });

  it("uses default values when parameters omitted", () => {
    const result = FlashcardsListQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.page_size).toBe(20);
      expect(result.data.sort).toBe("created_at_desc");
    }
  });

  it("transforms string page to number", () => {
    const result = FlashcardsListQuerySchema.safeParse({ page: "5" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(5);
    }
  });

  it("rejects page less than 1", () => {
    const result = FlashcardsListQuerySchema.safeParse({ page: "0" });

    expect(result.success).toBe(false);
  });

  it("rejects page_size exceeding 100", () => {
    const result = FlashcardsListQuerySchema.safeParse({ page_size: "101" });

    expect(result.success).toBe(false);
  });

  it("accepts valid sort options", () => {
    const sortOptions = ["created_at_desc", "created_at_asc", "last_reviewed_at_asc", "last_reviewed_at_desc"] as const;

    sortOptions.forEach((sort) => {
      const result = FlashcardsListQuerySchema.safeParse({ sort });
      expect(result.success).toBe(true);
    });
  });

  it("trims search query", () => {
    const result = FlashcardsListQuerySchema.safeParse({ q: "  typescript  " });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe("typescript");
    }
  });
});

describe("IdParamSchema", () => {
  it("accepts valid UUID", () => {
    const result = IdParamSchema.safeParse("550e8400-e29b-41d4-a716-446655440000");

    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID format", () => {
    const result = IdParamSchema.safeParse("not-a-uuid");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("valid UUID");
    }
  });

  it("rejects empty string", () => {
    const result = IdParamSchema.safeParse("");

    expect(result.success).toBe(false);
  });
});

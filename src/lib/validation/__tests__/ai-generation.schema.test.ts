/**
 * Unit tests for AI Generation validation schemas
 *
 * Tests cover:
 * - GenerateFlashcardsSchema validation rules
 * - FlashcardProposalSchema validation rules
 * - AcceptProposalsSchema validation rules
 * - Edge cases and boundary conditions
 */

import { describe, it, expect } from "vitest";
import { GenerateFlashcardsSchema, FlashcardProposalSchema, AcceptProposalsSchema } from "../ai-generation.schema";

describe("GenerateFlashcardsSchema", () => {
  describe("source_text validation", () => {
    it("accepts valid source text (100-10000 chars)", () => {
      const validText = "a".repeat(100);
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: validText,
        language: "pl",
        max_proposals: 10,
      });

      expect(result.success).toBe(true);
    });

    it("trims whitespace from source text", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "  " + "a".repeat(100) + "  ",
        language: "en",
        max_proposals: 5,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source_text).toBe("a".repeat(100));
      }
    });

    it("rejects source text shorter than 100 chars", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(99),
        language: "pl",
        max_proposals: 10,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 100 characters");
      }
    });

    it("rejects source text longer than 10000 chars", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(10001),
        language: "pl",
        max_proposals: 10,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("not exceed 10000 characters");
      }
    });

    it("accepts exactly 100 chars (lower boundary)", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(100),
        language: null,
        max_proposals: 1,
      });

      expect(result.success).toBe(true);
    });

    it("accepts exactly 10000 chars (upper boundary)", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(10000),
        language: null,
        max_proposals: 20,
      });

      expect(result.success).toBe(true);
    });

    it("rejects empty string after trimming", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "   ",
        language: "pl",
        max_proposals: 10,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("language validation", () => {
    it('accepts "pl" language', () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(100),
        language: "pl",
        max_proposals: 10,
      });

      expect(result.success).toBe(true);
    });

    it('accepts "en" language', () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(100),
        language: "en",
        max_proposals: 10,
      });

      expect(result.success).toBe(true);
    });

    it("accepts null language", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(100),
        language: null,
        max_proposals: 10,
      });

      expect(result.success).toBe(true);
    });

    it("rejects invalid language code", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(100),
        language: "fr",
        max_proposals: 10,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("max_proposals validation", () => {
    it("accepts valid max_proposals (1-20)", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(100),
        language: "pl",
        max_proposals: 10,
      });

      expect(result.success).toBe(true);
    });

    it("defaults to 20 when max_proposals is omitted", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(100),
        language: "pl",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.max_proposals).toBe(20);
      }
    });

    it("accepts exactly 1 (lower boundary)", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(100),
        language: null,
        max_proposals: 1,
      });

      expect(result.success).toBe(true);
    });

    it("accepts exactly 20 (upper boundary)", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(100),
        language: null,
        max_proposals: 20,
      });

      expect(result.success).toBe(true);
    });

    it("rejects max_proposals less than 1", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(100),
        language: "pl",
        max_proposals: 0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 1");
      }
    });

    it("rejects max_proposals greater than 20", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(100),
        language: "pl",
        max_proposals: 21,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("not exceed 20");
      }
    });

    it("rejects non-integer max_proposals", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(100),
        language: "pl",
        max_proposals: 10.5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("integer");
      }
    });

    it("rejects negative max_proposals", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(100),
        language: "pl",
        max_proposals: -5,
      });

      expect(result.success).toBe(false);
    });
  });
});

describe("FlashcardProposalSchema", () => {
  describe("front_text validation", () => {
    it("accepts valid front_text (1-1000 chars)", () => {
      const result = FlashcardProposalSchema.safeParse({
        front_text: "What is TypeScript?",
        back_text: "A typed superset of JavaScript",
      });

      expect(result.success).toBe(true);
    });

    it("trims whitespace from front_text", () => {
      const result = FlashcardProposalSchema.safeParse({
        front_text: "  Question  ",
        back_text: "Answer",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.front_text).toBe("Question");
      }
    });

    it("rejects empty front_text", () => {
      const result = FlashcardProposalSchema.safeParse({
        front_text: "",
        back_text: "Answer",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("not be empty");
      }
    });

    it("rejects front_text with only whitespace", () => {
      const result = FlashcardProposalSchema.safeParse({
        front_text: "   ",
        back_text: "Answer",
      });

      expect(result.success).toBe(false);
    });

    it("accepts exactly 1000 chars (upper boundary)", () => {
      const result = FlashcardProposalSchema.safeParse({
        front_text: "a".repeat(1000),
        back_text: "Answer",
      });

      expect(result.success).toBe(true);
    });

    it("rejects front_text longer than 1000 chars", () => {
      const result = FlashcardProposalSchema.safeParse({
        front_text: "a".repeat(1001),
        back_text: "Answer",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("not exceed 1000 characters");
      }
    });
  });

  describe("back_text validation", () => {
    it("accepts valid back_text (1-1000 chars)", () => {
      const result = FlashcardProposalSchema.safeParse({
        front_text: "Question",
        back_text: "A detailed answer explaining the concept",
      });

      expect(result.success).toBe(true);
    });

    it("trims whitespace from back_text", () => {
      const result = FlashcardProposalSchema.safeParse({
        front_text: "Question",
        back_text: "  Answer  ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.back_text).toBe("Answer");
      }
    });

    it("rejects empty back_text", () => {
      const result = FlashcardProposalSchema.safeParse({
        front_text: "Question",
        back_text: "",
      });

      expect(result.success).toBe(false);
    });
  });
});

describe("AcceptProposalsSchema", () => {
  describe("generation_session_id validation", () => {
    it("accepts valid UUID", () => {
      const result = AcceptProposalsSchema.safeParse({
        generation_session_id: "550e8400-e29b-41d4-a716-446655440000",
        cards: [{ front_text: "Question", back_text: "Answer" }],
      });

      expect(result.success).toBe(true);
    });

    it("rejects invalid UUID format", () => {
      const result = AcceptProposalsSchema.safeParse({
        generation_session_id: "not-a-uuid",
        cards: [{ front_text: "Question", back_text: "Answer" }],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("valid UUID");
      }
    });

    it("rejects empty string", () => {
      const result = AcceptProposalsSchema.safeParse({
        generation_session_id: "",
        cards: [{ front_text: "Question", back_text: "Answer" }],
      });

      expect(result.success).toBe(false);
    });
  });

  describe("cards array validation", () => {
    it("accepts valid cards array (1-20 items)", () => {
      const result = AcceptProposalsSchema.safeParse({
        generation_session_id: "550e8400-e29b-41d4-a716-446655440000",
        cards: [
          { front_text: "Q1", back_text: "A1" },
          { front_text: "Q2", back_text: "A2" },
        ],
      });

      expect(result.success).toBe(true);
    });

    it("accepts exactly 1 card (lower boundary)", () => {
      const result = AcceptProposalsSchema.safeParse({
        generation_session_id: "550e8400-e29b-41d4-a716-446655440000",
        cards: [{ front_text: "Question", back_text: "Answer" }],
      });

      expect(result.success).toBe(true);
    });

    it("accepts exactly 20 cards (upper boundary)", () => {
      const cards = Array.from({ length: 20 }, (_, i) => ({
        front_text: `Question ${i + 1}`,
        back_text: `Answer ${i + 1}`,
      }));

      const result = AcceptProposalsSchema.safeParse({
        generation_session_id: "550e8400-e29b-41d4-a716-446655440000",
        cards,
      });

      expect(result.success).toBe(true);
    });

    it("rejects empty cards array", () => {
      const result = AcceptProposalsSchema.safeParse({
        generation_session_id: "550e8400-e29b-41d4-a716-446655440000",
        cards: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 1 item");
      }
    });

    it("rejects more than 20 cards", () => {
      const cards = Array.from({ length: 21 }, (_, i) => ({
        front_text: `Question ${i + 1}`,
        back_text: `Answer ${i + 1}`,
      }));

      const result = AcceptProposalsSchema.safeParse({
        generation_session_id: "550e8400-e29b-41d4-a716-446655440000",
        cards,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("not exceed 20 items");
      }
    });

    it("validates each card in the array", () => {
      const result = AcceptProposalsSchema.safeParse({
        generation_session_id: "550e8400-e29b-41d4-a716-446655440000",
        cards: [
          { front_text: "Valid", back_text: "Valid" },
          { front_text: "", back_text: "Invalid" }, // Invalid card
        ],
      });

      expect(result.success).toBe(false);
    });

    it("rejects cards with missing fields", () => {
      const result = AcceptProposalsSchema.safeParse({
        generation_session_id: "550e8400-e29b-41d4-a716-446655440000",
        cards: [
          { front_text: "Question" }, // Missing back_text
        ],
      });

      expect(result.success).toBe(false);
    });
  });
});

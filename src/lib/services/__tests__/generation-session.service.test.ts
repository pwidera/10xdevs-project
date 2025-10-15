/**
 * Unit tests for Generation Session Service
 * 
 * Tests cover:
 * - Session creation with valid parameters
 * - Database error handling
 * - Edge cases and boundary conditions
 * - Supabase client mocking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GenerationSessionService,
  createGenerationSessionService,
  type CreateGenerationSessionParams,
} from '../generation-session.service';

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockSelect = vi.fn();
  const mockSingle = vi.fn();
  const mockInsert = vi.fn();
  const mockFrom = vi.fn();

  mockFrom.mockReturnValue({
    insert: mockInsert,
  });

  mockInsert.mockReturnValue({
    select: mockSelect,
  });

  mockSelect.mockReturnValue({
    single: mockSingle,
  });

  return {
    from: mockFrom,
    _mocks: {
      from: mockFrom,
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
    },
  };
};

describe('GenerationSessionService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let service: GenerationSessionService;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    // @ts-expect-error Mock Supabase client
    service = new GenerationSessionService(mockSupabase);
  });

  describe('createSession()', () => {
    const validParams: CreateGenerationSessionParams = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      proposalsCount: 10,
      sourceTextLength: 500,
      sourceTextHash: 'abc123hash',
      generateDuration: 2500,
    };

    describe('successful session creation', () => {
      it('creates session with all parameters', async () => {
        const mockSessionData = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          proposals_count: 10,
          source_text_length: 500,
          created_at: '2024-01-01T00:00:00Z',
        };

        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: mockSessionData,
          error: null,
        });

        const result = await service.createSession(validParams);

        expect(result).toEqual(mockSessionData);
        expect(mockSupabase._mocks.from).toHaveBeenCalledWith('generation_sessions');
        expect(mockSupabase._mocks.insert).toHaveBeenCalledWith({
          user_id: validParams.userId,
          proposals_count: validParams.proposalsCount,
          source_text_length: validParams.sourceTextLength,
          source_text_hash: validParams.sourceTextHash,
          generate_duration: validParams.generateDuration,
          accepted_count: 0,
        });
      });

      it('creates session without optional generateDuration', async () => {
        const paramsWithoutDuration = {
          ...validParams,
          generateDuration: undefined,
        };

        const mockSessionData = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          proposals_count: 10,
          source_text_length: 500,
          created_at: '2024-01-01T00:00:00Z',
        };

        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: mockSessionData,
          error: null,
        });

        const result = await service.createSession(paramsWithoutDuration);

        expect(result).toEqual(mockSessionData);
        expect(mockSupabase._mocks.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            generate_duration: undefined,
          })
        );
      });

      it('initializes accepted_count to 0', async () => {
        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: {
            id: '123',
            proposals_count: 5,
            source_text_length: 200,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        });

        await service.createSession(validParams);

        expect(mockSupabase._mocks.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            accepted_count: 0,
          })
        );
      });

      it('selects correct fields from created session', async () => {
        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: {
            id: '123',
            proposals_count: 10,
            source_text_length: 500,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        });

        await service.createSession(validParams);

        expect(mockSupabase._mocks.select).toHaveBeenCalledWith(
          'id, proposals_count, source_text_length, created_at'
        );
      });
    });

    describe('error handling', () => {
      it('throws error when database insert fails', async () => {
        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: null,
          error: {
            message: 'Database error',
            code: 'PGRST116',
          },
        });

        await expect(service.createSession(validParams)).rejects.toThrow(
          'Failed to save generation session'
        );
      });

      it('throws error when no data is returned', async () => {
        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: null,
          error: null,
        });

        await expect(service.createSession(validParams)).rejects.toThrow(
          'No data returned from generation session creation'
        );
      });

      it('logs error to console when database fails', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        const dbError = {
          message: 'Foreign key violation',
          code: '23503',
        };

        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: null,
          error: dbError,
        });

        await expect(service.createSession(validParams)).rejects.toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to create generation session:',
          dbError
        );

        consoleErrorSpy.mockRestore();
      });
    });

    describe('parameter validation', () => {
      it('accepts minimum valid proposals count (1)', async () => {
        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: {
            id: '123',
            proposals_count: 1,
            source_text_length: 100,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        });

        const params = { ...validParams, proposalsCount: 1 };
        const result = await service.createSession(params);

        expect(result.proposals_count).toBe(1);
      });

      it('accepts maximum valid proposals count (20)', async () => {
        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: {
            id: '123',
            proposals_count: 20,
            source_text_length: 100,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        });

        const params = { ...validParams, proposalsCount: 20 };
        const result = await service.createSession(params);

        expect(result.proposals_count).toBe(20);
      });

      it('accepts minimum source text length (100)', async () => {
        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: {
            id: '123',
            proposals_count: 5,
            source_text_length: 100,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        });

        const params = { ...validParams, sourceTextLength: 100 };
        const result = await service.createSession(params);

        expect(result.source_text_length).toBe(100);
      });

      it('accepts maximum source text length (10000)', async () => {
        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: {
            id: '123',
            proposals_count: 5,
            source_text_length: 10000,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        });

        const params = { ...validParams, sourceTextLength: 10000 };
        const result = await service.createSession(params);

        expect(result.source_text_length).toBe(10000);
      });

      it('accepts zero duration', async () => {
        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: {
            id: '123',
            proposals_count: 5,
            source_text_length: 100,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        });

        const params = { ...validParams, generateDuration: 0 };
        await service.createSession(params);

        expect(mockSupabase._mocks.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            generate_duration: 0,
          })
        );
      });

      it('accepts large duration values', async () => {
        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: {
            id: '123',
            proposals_count: 5,
            source_text_length: 100,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        });

        const params = { ...validParams, generateDuration: 60000 }; // 60 seconds
        await service.createSession(params);

        expect(mockSupabase._mocks.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            generate_duration: 60000,
          })
        );
      });
    });
  });

  describe('createGenerationSessionService()', () => {
    it('creates service instance', () => {
      // @ts-expect-error Mock Supabase client
      const service = createGenerationSessionService(mockSupabase);
      expect(service).toBeInstanceOf(GenerationSessionService);
    });
  });
});


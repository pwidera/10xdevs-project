/**
 * Unit tests for HTTP service utilities
 * 
 * Tests cover:
 * - post() function for API requests
 * - del() function for delete requests
 * - Response normalization to ApiResponse shape
 * - Error handling and status code mapping
 * - Edge cases and boundary conditions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { post, del } from '../http';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('post()', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('successful requests', () => {
    it('returns normalized success response with data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true, data: { id: 1, name: 'Test' } }),
      });

      const result = await post('/api/test', { foo: 'bar' });

      expect(result).toEqual({
        ok: true,
        data: { id: 1, name: 'Test' },
      });
    });

    it('normalizes plain data response to ApiSuccess shape', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 1, name: 'Test' }),
      });

      const result = await post('/api/test', { foo: 'bar' });

      expect(result).toEqual({
        ok: true,
        data: { id: 1, name: 'Test' },
      });
    });

    it('passes through backend ApiResponse with redirect', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true, redirect: '/dashboard' }),
      });

      const result = await post('/api/login', { email: 'test@example.com' });

      expect(result).toEqual({
        ok: true,
        redirect: '/dashboard',
      });
    });

    it('handles empty response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      const result = await post('/api/test', {});

      expect(result).toEqual({
        ok: true,
        data: null,
      });
    });
  });

  describe('request configuration', () => {
    it('sends POST request with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true }),
      });

      await post('/api/test', { foo: 'bar' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          credentials: 'same-origin',
        })
      );
    });

    it('serializes request body as JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true }),
      });

      const body = { email: 'test@example.com', password: 'secret' };
      await post('/api/login', body);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/login',
        expect.objectContaining({
          body: JSON.stringify(body),
        })
      );
    });

    it('handles null body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true }),
      });

      await post('/api/test', null);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          body: JSON.stringify({}),
        })
      );
    });

    it('merges custom headers with defaults', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true }),
      });

      await post('/api/test', {}, {
        headers: { 'X-Custom-Header': 'value' },
      });

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).toBeDefined();
      expect(callArgs.headers['X-Custom-Header']).toBe('value');
    });

    it('passes through additional RequestInit options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true }),
      });

      await post('/api/test', {}, {
        signal: new AbortController().signal,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });

  describe('error responses', () => {
    it('returns ApiError for 400 Bad Request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
        }),
      });

      const result = await post('/api/test', {});

      expect(result).toEqual({
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
        },
      });
    });

    it('returns ApiError for 401 Unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        }),
      });

      const result = await post('/api/protected', {});

      expect(result).toEqual({
        ok: false,
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
        details: expect.any(Object),
      });
    });

    it('returns ApiError for 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({
          code: 'INTERNAL_ERROR',
          message: 'Server error',
        }),
      });

      const result = await post('/api/test', {});

      expect(result).toEqual({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: 'Server error',
        details: expect.any(Object),
      });
    });

    it('generates default error code from status when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ message: 'Not found' }),
      });

      const result = await post('/api/test', {});

      expect(result).toEqual({
        ok: false,
        code: 'HTTP_404',
        message: 'Not found',
        details: expect.any(Object),
      });
    });

    it('handles non-JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const result = await post('/api/test', {});

      expect(result).toEqual({
        ok: false,
        code: 'HTTP_500',
        details: 'Internal Server Error',
      });
    });

    it('handles empty error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => '',
      });

      const result = await post('/api/test', {});

      expect(result).toEqual({
        ok: false,
        code: 'HTTP_500',
        details: null,
      });
    });

    it('preserves error details field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({
          code: 'VALIDATION_ERROR',
          message: 'Invalid fields',
          details: { fields: ['email', 'password'] },
        }),
      });

      const result = await post('/api/test', {});

      expect(result).toEqual({
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'Invalid fields',
        details: { fields: ['email', 'password'] },
      });
    });
  });
});

describe('del()', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends POST request (not DELETE method)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    await del('/api/resource/123');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/resource/123',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
      })
    );
  });

  it('returns normalized success response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: { deleted: true } }),
    });

    const result = await del('/api/resource/123');

    expect(result).toEqual({
      ok: true,
      data: { deleted: true },
    });
  });

  it('normalizes plain data response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ deleted: true }),
    });

    const result = await del('/api/resource/123');

    expect(result).toEqual({
      ok: true,
      data: { deleted: true },
    });
  });

  it('handles error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ code: 'NOT_FOUND', message: 'Resource not found' }),
    });

    const result = await del('/api/resource/999');

    expect(result).toEqual({
      ok: false,
      code: 'NOT_FOUND',
      message: 'Resource not found',
      details: expect.any(Object),
    });
  });

  it('handles JSON parse errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const result = await del('/api/resource/123');

    expect(result).toEqual({
      ok: true,
      data: null,
    });
  });
});


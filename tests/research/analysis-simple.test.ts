import { describe, it, expect, beforeEach } from 'bun:test';

describe('Analysis Module Import', () => {
  it('should import types', () => {
    const { ConfidenceLevel } = await import('../../src/research/types.js');
    expect(ConfidenceLevel).toBeDefined();
  });
});
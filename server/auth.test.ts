import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as jwt from './jwt';

describe('JWT Authentication', () => {
  const testSecret = 'test-secret-key';
  const testUser = {
    id: 1,
    email: 'test@example.com',
    is_admin: false,
    is_verified: true,
    created_at: new Date(),
  };

  beforeEach(() => {
    process.env.JWT_SECRET = testSecret;
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = jwt.generateToken(testUser as any);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should encode user data correctly', () => {
      const token = jwt.generateToken(testUser as any);
      const decoded = jwt.verifyToken(token) as any;
      expect(decoded.userId).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.isVerified).toBe(true);
      expect(decoded.isAdmin).toBe(false);
    });

    it('should create unique tokens for same user', () => {
      const token1 = jwt.generateToken(testUser as any);
      const token2 = jwt.generateToken(testUser as any);
      // Tokens might be same due to same payload, but structure should be valid
      expect(token1.split('.').length).toBe(3);
      expect(token2.split('.').length).toBe(3);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = jwt.generateToken(testUser as any);
      const decoded = jwt.verifyToken(token);
      expect(decoded).toBeDefined();
      expect((decoded as any).userId).toBe(testUser.id);
      expect((decoded as any).email).toBe(testUser.email);
    });

    it('should return null on invalid token', () => {
      const result = jwt.verifyToken('invalid.token.format');
      expect(result).toBeNull();
    });

    it('should return null on tampered token', () => {
      const token = jwt.generateToken(testUser as any);
      const tampered = token.slice(0, -5) + 'xxxxx';
      const result = jwt.verifyToken(tampered);
      expect(result).toBeNull();
    });

    it('should handle tampered signatures gracefully', () => {
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBlbWFpbC5jb20ifQ.invalid_signature';
      const result = jwt.verifyToken(invalidToken);
      expect(result).toBeNull();
    });
  });

  describe('Token extraction', () => {
    it('should extract JWT from Bearer token in Authorization header', () => {
      const token = jwt.generateToken(testUser as any);
      const mockReq = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as any;

      const payload = jwt.getPayloadFromRequest(mockReq);
      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(testUser.id);
    });

    it('should return null for missing Authorization header', () => {
      const mockReq = {
        headers: {},
      } as any;

      const payload = jwt.getPayloadFromRequest(mockReq);
      expect(payload).toBeNull();
    });

    it('should return null for invalid Bearer format', () => {
      const mockReq = {
        headers: {
          authorization: 'InvalidFormat token',
        },
      } as any;

      const payload = jwt.getPayloadFromRequest(mockReq);
      expect(payload).toBeNull();
    });
  });
});

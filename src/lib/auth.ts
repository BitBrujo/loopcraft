import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { getUserById, getUserByUsername, createUser } from './dal/users';
import { getOrCreateUserSettings } from './dal/users';
import type { UserProfile } from './dal/types';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_SALT_ROUNDS = 10;

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set! Using default (not secure for production)');
}

// JWT payload interface
export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
}

// Authentication result
export interface AuthResult {
  user: Omit<UserProfile, 'password_hash'>;
  token: string;
}

// ============================================================================
// Password Hashing
// ============================================================================

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================================
// JWT Token Operations
// ============================================================================

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

// ============================================================================
// Authentication Operations
// ============================================================================

/**
 * Register a new user
 */
export async function register(
  username: string,
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResult> {
  // Check if username already exists
  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    throw new Error('Username already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await createUser({
    username,
    email,
    password_hash: passwordHash,
    display_name: displayName || username,
  });

  // Create default settings for user
  await getOrCreateUserSettings(user.id);

  // Generate token
  const token = generateToken({
    userId: user.id,
    username: user.username,
    email: user.email,
  });

  // Return user (without password hash) and token
  const { password_hash, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    token,
  };
}

/**
 * Login a user
 */
export async function login(username: string, password: string): Promise<AuthResult> {
  // Get user by username
  const user = await getUserByUsername(username);
  if (!user) {
    throw new Error('Invalid username or password');
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid username or password');
  }

  // Generate token
  const token = generateToken({
    userId: user.id,
    username: user.username,
    email: user.email,
  });

  // Return user (without password hash) and token
  const { password_hash, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    token,
  };
}

/**
 * Get current user from token
 */
export async function getCurrentUser(
  token: string
): Promise<Omit<UserProfile, 'password_hash'> | null> {
  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await getUserById(payload.userId);
  if (!user) return null;

  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// ============================================================================
// Middleware Helpers
// ============================================================================

/**
 * Extract user from request Authorization header
 */
export async function getUserFromRequest(
  request: Request
): Promise<Omit<UserProfile, 'password_hash'> | null> {
  const authHeader = request.headers.get('Authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) return null;

  return getCurrentUser(token);
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(
  request: Request
): Promise<Omit<UserProfile, 'password_hash'>> {
  const user = await getUserFromRequest(request);

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Create authentication cookie
 */
export function createAuthCookie(token: string): string {
  const maxAge = JWT_EXPIRES_IN.endsWith('d')
    ? parseInt(JWT_EXPIRES_IN) * 24 * 60 * 60
    : 7 * 24 * 60 * 60; // default 7 days in seconds

  return `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}; Path=/`;
}

/**
 * Clear authentication cookie
 */
export function clearAuthCookie(): string {
  return 'auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/';
}
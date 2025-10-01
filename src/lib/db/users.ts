import { query, queryOne, execute } from '../db';
import { v4 as uuidv4 } from 'crypto';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password_hash: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
}

export interface UpdateUserInput {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  email?: string;
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  return queryOne<User>(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );
}

// Get user by username
export async function getUserByUsername(username: string): Promise<User | null> {
  return queryOne<User>(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  return queryOne<User>(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
}

// Create new user
export async function createUser(input: CreateUserInput): Promise<User> {
  const id = uuidv4();

  await execute(
    `INSERT INTO users (id, username, email, password_hash, display_name, avatar_url, bio)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.username,
      input.email,
      input.password_hash,
      input.display_name || null,
      input.avatar_url || null,
      input.bio || null,
    ]
  );

  const user = await getUserById(id);
  if (!user) {
    throw new Error('Failed to create user');
  }

  return user;
}

// Update user
export async function updateUser(
  id: string,
  input: UpdateUserInput
): Promise<User | null> {
  const fields: string[] = [];
  const values: any[] = [];

  if (input.display_name !== undefined) {
    fields.push('display_name = ?');
    values.push(input.display_name);
  }
  if (input.avatar_url !== undefined) {
    fields.push('avatar_url = ?');
    values.push(input.avatar_url);
  }
  if (input.bio !== undefined) {
    fields.push('bio = ?');
    values.push(input.bio);
  }
  if (input.email !== undefined) {
    fields.push('email = ?');
    values.push(input.email);
  }

  if (fields.length === 0) {
    return getUserById(id);
  }

  values.push(id);

  await execute(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return getUserById(id);
}

// Delete user
export async function deleteUser(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// List all users (admin function)
export async function listUsers(limit = 50, offset = 0): Promise<User[]> {
  return query<User>(
    'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
}

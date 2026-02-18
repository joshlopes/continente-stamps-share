import { describe, expect, test } from 'bun:test';
import { User } from '../Domain/User/User';
import { UserId } from '../Domain/User/UserId';

describe('User', () => {
  test('should create a user with default values', () => {
    const user = User.create({
      email: 'test@example.com',
      passwordHash: 'hashed-password',
    });

    expect(user.email).toBe('test@example.com');
    expect(user.passwordHash).toBe('hashed-password');
    expect(user.name).toBeNull();
    expect(user.role).toBe('ADMIN');
    expect(user.isActive).toBe(true);
    expect(user.lastLoginAt).toBeNull();
    expect(user.id).toBeInstanceOf(UserId);
  });

  test('should create a user with custom values', () => {
    const user = User.create({
      email: 'admin@example.com',
      passwordHash: 'hashed-password',
      name: 'Admin User',
      role: 'SUPER_ADMIN',
      isActive: false,
    });

    expect(user.email).toBe('admin@example.com');
    expect(user.name).toBe('Admin User');
    expect(user.role).toBe('SUPER_ADMIN');
    expect(user.isActive).toBe(false);
  });

  test('should update last login', () => {
    const user = User.create({
      email: 'test@example.com',
      passwordHash: 'hashed-password',
    });

    expect(user.lastLoginAt).toBeNull();

    user.updateLastLogin();

    expect(user.lastLoginAt).toBeInstanceOf(Date);
  });
});

describe('UserId', () => {
  test('should generate a valid UUID', () => {
    const id = new UserId();
    expect(id.toString()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  test('should accept a valid UUID', () => {
    const uuid = '01234567-89ab-cdef-0123-456789abcdef';
    const id = new UserId(uuid);
    expect(id.toString()).toBe(uuid);
  });

  test('should throw for invalid UUID', () => {
    expect(() => new UserId('invalid')).toThrow('Invalid UUID');
  });
});

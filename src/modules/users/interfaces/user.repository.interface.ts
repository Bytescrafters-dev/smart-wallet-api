import { User } from '@prisma/client';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  updateAvatar(id: string, avatar: string): Promise<void>;
  updateProfile(id: string, data: { firstName?: string; lastName?: string; phone?: string }): Promise<Omit<User, 'passwordHash'>>;
}

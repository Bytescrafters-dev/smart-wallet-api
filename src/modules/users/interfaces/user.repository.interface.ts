import { User } from '@prisma/client';
import { ListUsersOffsetParams, ListUsersOffsetResult } from '../types/users';

export interface IUserRepository {
  create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User>;
  listUsers(params: ListUsersOffsetParams): Promise<ListUsersOffsetResult>;
  updateById(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      avatar: string;
      phone: string;
    }>,
  ): Promise<Omit<User, 'passwordHash'>>;
}

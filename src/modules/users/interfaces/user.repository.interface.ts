import { AdminRole, User } from '@prisma/client';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  role: AdminRole;
  mustChangePassword: boolean;
  createdById: string;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  updateAvatar(id: string, avatar: string): Promise<void>;
  updateProfile(
    id: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<Omit<User, 'passwordHash'>>;
  createUser(data: CreateUserData): Promise<User>;
  createAdminStores(
    userId: string,
    storeIds: string[],
    role: AdminRole,
  ): Promise<void>;
  getAdminStoreIds(userId: string): Promise<string[]>;
  findByStore(storeId: string): Promise<any[]>;
  findByStoreIds(params: {
    storeIds: string[];
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }>;
  findUserWithStores(id: string): Promise<any | null>;
  updateUser(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      role?: AdminRole;
    },
  ): Promise<any>;
  deactivateUser(id: string): Promise<void>;
  removeStoreAccess(userId: string, storeId: string): Promise<void>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}

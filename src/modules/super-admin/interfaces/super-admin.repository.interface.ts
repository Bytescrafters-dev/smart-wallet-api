import { SuperAdmin, SuperAdminRole } from '@prisma/client';

export interface CreateSuperAdminData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role?: SuperAdminRole;
  mustChangePassword?: boolean;
  createdById?: string;
}

export interface ISuperAdminRepository {
  findByEmail(email: string): Promise<SuperAdmin | null>;
  findById(id: string): Promise<SuperAdmin | null>;
  create(data: CreateSuperAdminData): Promise<SuperAdmin>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  updateAvatar(id: string, avatar: string): Promise<void>;
  updateProfile(
    id: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<Omit<SuperAdmin, 'passwordHash'>>;
}

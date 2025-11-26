import { Role, User, UserStatus } from '@prisma/client';

export type ListUsersOffsetParams = {
  role?: Role;
  status?: UserStatus;
  q?: string;
  page: number;
  pageSize: number;
};

export type ListUsersOffsetResult = {
  items: Pick<
    User,
    | 'id'
    | 'email'
    | 'firstName'
    | 'lastName'
    | 'avatar'
    | 'phone'
    | 'role'
    | 'status'
    | 'createdAt'
  >[];
  total: number;
  page: number;
  pageSize: number;
};

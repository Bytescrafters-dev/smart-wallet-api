import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdminRole, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { TOKENS } from 'src/common/constants/tokens';
import { IUserRepository } from './interfaces/user.repository.interface';
import { CreateAdminUserDto } from './dtos/create-admin-user.dto';
import { UpdateAdminUserDto } from './dtos/update-admin-user.dto';
import { AssignStoresDto } from './dtos/assign-stores.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(TOKENS.UserRepo)
    private readonly userRepo: IUserRepository,
  ) {}

  async getUserById(
    userId: string,
  ): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.userRepo.findById(userId);
    if (!user) return null;
    const { passwordHash: _, ...rest } = user;
    return rest;
  }

  async updateAvatar(userId: string, avatar: string): Promise<void> {
    await this.userRepo.updateAvatar(userId, avatar);
  }

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<Omit<User, 'passwordHash'>> {
    return this.userRepo.updateProfile(userId, data);
  }

  async createUser(
    dto: CreateAdminUserDto,
    callerId: string,
    callerRole: AdminRole,
  ) {
    if (callerRole === AdminRole.MANAGER && dto.role !== AdminRole.VIEWER) {
      throw new ForbiddenException('Managers can only create Viewer accounts');
    }

    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    const callerStoreIds = await this.userRepo.getAdminStoreIds(callerId);
    const unauthorized = dto.storeIds.filter(
      (id) => !callerStoreIds.includes(id),
    );
    if (unauthorized.length > 0) {
      throw new ForbiddenException(
        'You do not have access to one or more of the specified stores',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.userRepo.createUser({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName ?? null,
      phone: dto.phone ?? null,
      role: dto.role,
      mustChangePassword: true,
      createdById: callerId,
    });

    await this.userRepo.createAdminStores(user.id, dto.storeIds, dto.role);

    const { passwordHash: _, ...rest } = user;
    return rest;
  }

  async listByStore(storeId: string, callerId: string) {
    const callerStoreIds = await this.userRepo.getAdminStoreIds(callerId);
    if (!callerStoreIds.includes(storeId)) {
      throw new ForbiddenException('You do not have access to this store');
    }
    return this.userRepo.findByStore(storeId);
  }

  async listUsersAllStores(
    callerId: string,
    params: { q?: string; page?: number; limit?: number },
  ) {
    const callerStoreIds = await this.userRepo.getAdminStoreIds(callerId);
    const { page = 1, limit = 20 } = params;
    const { data, total } = await this.userRepo.findByStoreIds({
      storeIds: callerStoreIds,
      ...params,
    });
    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const user = await this.userRepo.findUserWithStores(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(id: string, dto: UpdateAdminUserDto, callerRole: AdminRole) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (user.role === AdminRole.OWNER)
      throw new ForbiddenException('You cannot update owner profiles');

    if (user.role === AdminRole.MANAGER && callerRole !== AdminRole.OWNER)
      throw new ForbiddenException('You cannot update manager profiles');

    if (callerRole === AdminRole.MANAGER && dto.role !== AdminRole.VIEWER)
      throw new ForbiddenException('Managers can only update Viewer accounts');

    return this.userRepo.updateUser(id, dto);
  }

  async assignStores(userId: string, dto: AssignStoresDto, callerId: string) {
    const callerStoreIds = await this.userRepo.getAdminStoreIds(callerId);
    const unauthorized = dto.storeIds.filter(
      (id) => !callerStoreIds.includes(id),
    );
    if (unauthorized.length > 0) {
      throw new ForbiddenException(
        'You do not have access to one or more of the specified stores',
      );
    }

    const targetUser = await this.userRepo.findById(userId);
    if (!targetUser) throw new NotFoundException('User not found');

    await this.userRepo.createAdminStores(
      userId,
      dto.storeIds,
      targetUser.role,
    );
    return this.userRepo.findUserWithStores(userId);
  }

  async removeStoreAccess(userId: string, storeId: string, callerId: string) {
    const callerStoreIds = await this.userRepo.getAdminStoreIds(callerId);
    if (!callerStoreIds.includes(storeId)) {
      throw new ForbiddenException('You do not have access to this store');
    }

    const targetUser = await this.userRepo.findById(userId);
    if (!targetUser) throw new NotFoundException('User not found');

    await this.userRepo.removeStoreAccess(userId, storeId);
    return { message: 'Store access removed' };
  }

  async deactivateUser(id: string, callerId: string, callerRole: AdminRole) {
    if (id === callerId) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (callerRole === AdminRole.MANAGER && user.role !== AdminRole.VIEWER)
      throw new ForbiddenException(
        'Managers can only deactivate staff accounts',
      );

    await this.userRepo.deactivateUser(id);
    return { message: 'User deactivated' };
  }
}

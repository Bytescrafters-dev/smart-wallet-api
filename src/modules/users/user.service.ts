import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { TOKENS } from 'src/common/constants/tokens';
import { IUserRepository } from './interfaces/user.repository.interface';
import { CreateUserDto } from './dtos/create-user.dto';
import { User } from '@prisma/client';
import { ListUsersFilterDto } from './dtos/list-users-filter.dto';
import { ListUsersOffsetResult } from './types/users';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(TOKENS.UserRepo)
    private readonly userRepo: IUserRepository,
  ) {}

  async register(dto: CreateUserDto): Promise<User> {
    const { firstName, lastName, email, password, phone = '', avatar } = dto;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.userRepo.create({
      firstName,
      lastName,
      phone,
      avatar,
      email,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    return user;
  }

  async listUsers(filters: ListUsersFilterDto): Promise<ListUsersOffsetResult> {
    return this.userRepo.listUsers({
      role: filters.role,
      status: filters.status,
      q: filters.q,
      page: filters.page ?? 0,
      pageSize: filters.pageSize ?? 10,
    });
  }

  async getUserById(
    userId: string,
  ): Promise<Omit<User, 'passwordHash' | 'createdAt' | 'updatedAt'>> {
    const user = await this.userRepo.findById(userId);

    const { id, firstName, lastName, status, email, phone, avatar, role } =
      user;

    return {
      id,
      firstName,
      lastName,
      status,
      email,
      phone,
      avatar,
      role,
    };
  }

  async updateUserById(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    if (!userId) throw new ForbiddenException('Invalid user id provided');

    const data = {
      ...(dto.firstName && { firstName: dto.firstName }),
      ...(dto.lastName && { lastName: dto.lastName }),
      ...(dto.phone && { phone: dto.phone }),
      ...(dto.avatar && { avatar: dto.avatar }),
    };

    return this.userRepo.updateById(userId, data);
  }
}

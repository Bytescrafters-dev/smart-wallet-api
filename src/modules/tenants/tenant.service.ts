import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { TenantPlan, TenantStatus } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { TOKENS } from 'src/common/constants/tokens';
import { ITenantRepository } from './interfaces/tenant.repository.interface';
import { IRefreshTokenRepository } from '../auth/interfaces/refresh-token.repository.interface';
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { UpdateTenantDto } from './dtos/update-tenant.dto';
import { ListTenantsQueryDto } from './dtos/list-tenants-query.dto';

@Injectable()
export class TenantService {
  constructor(
    @Inject(TOKENS.TenantRepo)
    private readonly tenantRepo: ITenantRepository,
    @Inject(TOKENS.RefreshTokenRepo)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createTenant(dto: CreateTenantDto, superAdminId: string) {
    const emailTaken = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (emailTaken) {
      throw new ConflictException('A user with this email already exists');
    }

    if (dto.plan === TenantPlan.TRIAL && !dto.trialEndsAt) {
      throw new BadRequestException('trialEndsAt is required for TRIAL plan');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.$transaction(async (tx) => {
      // Tenant is created first so its id can be set on the User
      const tenant = await this.tenantRepo.create(
        {
          companyName: dto.companyName,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          email: dto.email,
          plan: dto.plan,
          status: dto.status,
          trialEndsAt:
            dto.plan === TenantPlan.TRIAL && dto.trialEndsAt
              ? new Date(dto.trialEndsAt)
              : null,
          notes: dto.notes,
          createdById: superAdminId,
        },
        tx,
      );

      await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone ?? null,
          role: 'OWNER',
          mustChangePassword: true,
          tenantId: tenant.id,
        },
      });

      return { tenant, user: true };
    });
  }

  async listTenants(query: ListTenantsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const params = {
      status: query.status,
      plan: query.plan,
      q: query.q,
      skip,
      take: limit,
    };

    const [data, total] = await Promise.all([
      this.tenantRepo.list(params),
      this.tenantRepo.count(params),
    ]);

    return { data, total, page, limit };
  }

  async getTenant(id: string) {
    const tenant = await this.tenantRepo.findById(id);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async updateTenant(id: string, dto: UpdateTenantDto) {
    const tenant = await this.tenantRepo.findById(id);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const updateData: any = {};

    const scalarFields = [
      'companyName',
      'firstName',
      'lastName',
      'phone',
      'plan',
      'status',
      'notes',
    ] as const;

    for (const field of scalarFields) {
      if (dto[field] !== undefined) updateData[field] = dto[field];
    }

    if (dto.plan !== undefined) {
      if (dto.plan === TenantPlan.TRIAL) {
        updateData.trialEndsAt = dto.trialEndsAt
          ? new Date(dto.trialEndsAt)
          : tenant.trialEndsAt;
      } else {
        updateData.trialEndsAt = null;
      }
    } else if (dto.trialEndsAt !== undefined) {
      updateData.trialEndsAt = new Date(dto.trialEndsAt);
    }

    const updated = await this.tenantRepo.update(id, updateData);

    const isBeingDeactivated =
      dto.status !== undefined &&
      dto.status !== tenant.status &&
      (dto.status === TenantStatus.SUSPENDED ||
        dto.status === TenantStatus.CANCELED);

    if (isBeingDeactivated) {
      await this.refreshTokenRepo.revokeAllByTenantId(id);
    }

    return updated;
  }
}

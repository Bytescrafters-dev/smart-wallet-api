import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { TOKENS } from 'src/common/constants/tokens';
import { ILeadRepository } from './interfaces/lead.repository.interface';
import { CreateLeadDto } from './dtos/create-lead.dto';
import { UpdateLeadDto } from './dtos/update-lead.dto';
import { BulkCreateLeadsDto } from './dtos/bulk-create-leads.dto';
import { LeadsQueryDto } from './dtos/leads-query.dto';
import { IStoreRepository } from '../stores/interfaces/store.repository.interface';

@Injectable()
export class LeadsService {
  constructor(
    @Inject(TOKENS.LeadRepo)
    private readonly leadRepo: ILeadRepository,
    @Inject(TOKENS.StoreRepo)
    private readonly storeRepo: IStoreRepository,
  ) {}

  async create(storeSlug: string, dto: CreateLeadDto) {
    const store = await this.storeRepo.findBySlug(storeSlug);
    if (!store) throw new NotFoundException('Store not found slug');

    return this.leadRepo.create(this.toLeadData(store.id, dto));
  }

  async bulkCreate(storeSlug: string, dto: BulkCreateLeadsDto) {
    const store = await this.storeRepo.findBySlug(storeSlug);
    if (!store) throw new NotFoundException('Store not found slug');

    const validLeads: ReturnType<typeof this.toLeadData>[] = [];
    const errors: { row: number; reason: string }[] = [];

    for (let i = 0; i < dto.leads.length; i++) {
      const instance = plainToInstance(CreateLeadDto, dto.leads[i]);
      const validationErrors = await validate(instance);

      if (validationErrors.length > 0) {
        const reason = validationErrors
          .flatMap((e) => Object.values(e.constraints ?? {}))
          .join('; ');
        errors.push({ row: i + 1, reason });
        continue;
      }

      validLeads.push(this.toLeadData(store.id, instance));
    }

    const imported =
      validLeads.length > 0 ? await this.leadRepo.createMany(validLeads) : 0;

    return { imported, failed: errors.length, errors };
  }

  async findOne(id: string) {
    const lead = await this.leadRepo.findById(id);
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async list(storeSlug: string, query: LeadsQueryDto) {
    const store = await this.storeRepo.findBySlug(storeSlug);
    if (!store) throw new NotFoundException('Store not found slug');
    const storeId = store.id;
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const params = {
      storeId,
      status: query.status,
      source: query.source,
      q: query.q,
      createdAtFrom: query.createdAtFrom ? new Date(query.createdAtFrom) : undefined,
      createdAtTo: query.createdAtTo ? new Date(query.createdAtTo) : undefined,
      followupFrom: query.followupFrom ? new Date(query.followupFrom) : undefined,
      followupTo: query.followupTo ? new Date(query.followupTo) : undefined,
      skip,
      take: limit,
    };

    const [data, total] = await Promise.all([
      this.leadRepo.list(params),
      this.leadRepo.count(params),
    ]);

    return { data, total, page, limit };
  }

  async update(id: string, dto: UpdateLeadDto) {
    const lead = await this.leadRepo.findById(id);
    if (!lead) throw new NotFoundException('Lead not found');

    const data: Record<string, any> = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.address1 !== undefined) data.address1 = dto.address1;
    if (dto.address2 !== undefined) data.address2 = dto.address2;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.state !== undefined) data.state = dto.state;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.postalCode !== undefined) data.postalCode = dto.postalCode;
    if (dto.source !== undefined) data.source = dto.source;
    if (dto.productSKUs !== undefined) data.productSKUs = dto.productSKUs;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.note !== undefined) data.note = dto.note;
    if (dto.followUpDate !== undefined)
      data.followUpDate = dto.followUpDate ? new Date(dto.followUpDate) : null;
    if (dto.assignedToId !== undefined) data.assignedToId = dto.assignedToId;

    return this.leadRepo.update(id, data);
  }

  async remove(id: string) {
    const lead = await this.leadRepo.findById(id);
    if (!lead) throw new NotFoundException('Lead not found');
    await this.leadRepo.delete(id);
    return { message: 'Lead deleted' };
  }

  private toLeadData(storeId: string, dto: CreateLeadDto) {
    return {
      storeId,
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email ?? null,
      address1: dto.address1 ?? null,
      address2: dto.address2 ?? null,
      city: dto.city ?? null,
      state: dto.state ?? null,
      country: dto.country ?? null,
      postalCode: dto.postalCode ?? null,
      source: dto.source,
      productSKUs: dto.productSKUs ?? [],
      note: dto.note ?? null,
      followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
      assignedToId: dto.assignedToId ?? null,
    };
  }
}

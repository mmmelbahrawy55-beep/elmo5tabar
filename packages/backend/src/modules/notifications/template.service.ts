import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';

@Injectable()
export class NotificationTemplateService {
  private readonly logger = new Logger(NotificationTemplateService.name);
  private readonly templateCache = new Map<string, { template: any; cachedAt: number }>();
  private readonly CACHE_TTL = 300000;

  constructor(private readonly prisma: PrismaService) {}

  async getTemplate(type: string, channel: string, lang: string): Promise<any | null> {
    try {
      const cacheKey = `${type}:${channel}:${lang}`;
      const cached = this.templateCache.get(cacheKey);
      if (cached && Date.now() - cached.cachedAt < this.CACHE_TTL) {
        return cached.template;
      }

      const templateDb = (this.prisma as any).notificationTemplate;
      const template = await templateDb.findFirst({
        where: { type, channel, lang, isActive: true },
        orderBy: { version: 'desc' },
      });

      if (template) {
        this.templateCache.set(cacheKey, { template, cachedAt: Date.now() });
      }

      return template || null;
    } catch (error) {
      this.logger.error(`Failed to get template for ${type}/${channel}/${lang}: ${error.message}`);
      return null;
    }
  }

  async render(template: string, variables: Record<string, any>): Promise<string> {
    try {
      let result = template;

      result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        if (variables[key] !== undefined && variables[key] !== null) {
          return String(variables[key]);
        }
        return match;
      });

      result = result.replace(/\{#if (\w+)\}([\s\S]*?)\{\/if\}/g, (match, key, content) => {
        if (variables[key]) {
          return content.replace(/\{\{(\w+)\}\}/g, (m, k) => String(variables[k] ?? m));
        }
        return '';
      });

      result = result.replace(/\{#unless (\w+)\}([\s\S]*?)\{\/unless\}/g, (match, key, content) => {
        if (!variables[key]) {
          return content.replace(/\{\{(\w+)\}\}/g, (m, k) => String(variables[k] ?? m));
        }
        return '';
      });

      result = result.replace(/\{#each (\w+)\}([\s\S]*?)\{\/each\}/g, (match, key, content) => {
        const items = variables[key];
        if (Array.isArray(items)) {
          return items.map((item: any) => {
            return content.replace(/\{\{this\.(\w+)\}\}/g, (m, k) => String(item[k] ?? m));
          }).join('');
        }
        return '';
      });

      return result;
    } catch (error) {
      this.logger.error(`Template render error: ${error.message}`);
      return template;
    }
  }

  async getAllTemplates(filters: { type?: string; channel?: string; lang?: string; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const templateDb = (this.prisma as any).notificationTemplate;
    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.channel) where.channel = filters.channel;
    if (filters.lang) where.lang = filters.lang;

    const [data, total] = await Promise.all([
      templateDb.findMany({ where, skip, take: limit, orderBy: { updatedAt: 'desc' } }),
      templateDb.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async createTemplate(dto: {
    type: string;
    channel: string;
    lang: string;
    titleAr: string;
    titleEn: string;
    bodyAr: string;
    bodyEn: string;
    smsBodyAr?: string;
    smsBodyEn?: string;
    pushTitleAr?: string;
    pushTitleEn?: string;
    pushBodyAr?: string;
    pushBodyEn?: string;
    variables?: Record<string, any>;
  }) {
    const templateDb = (this.prisma as any).notificationTemplate;

    const latestVersion = await templateDb.findFirst({
      where: { type: dto.type, channel: dto.channel, lang: dto.lang },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const template = await templateDb.create({
      data: {
        ...dto,
        version: (latestVersion?.version || 0) + 1,
        isActive: false,
      },
    });

    this.templateCache.clear();
    this.logger.log(`Created template v${template.version} for ${dto.type}/${dto.channel}/${dto.lang}`);
    return template;
  }

  async updateTemplate(id: string, dto: Partial<{
    titleAr: string;
    titleEn: string;
    bodyAr: string;
    bodyEn: string;
    smsBodyAr: string;
    smsBodyEn: string;
    pushTitleAr: string;
    pushTitleEn: string;
    pushBodyAr: string;
    pushBodyEn: string;
    variables: Record<string, any>;
  }>) {
    const templateDb = (this.prisma as any).notificationTemplate;
    const existing = await templateDb.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Template ${id} not found`);

    const updated = await templateDb.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
    });

    this.templateCache.clear();
    return updated;
  }

  async activateTemplate(id: string) {
    const templateDb = (this.prisma as any).notificationTemplate;
    const template = await templateDb.findUnique({ where: { id } });
    if (!template) throw new NotFoundException(`Template ${id} not found`);

    await templateDb.updateMany({
      where: { type: template.type, channel: template.channel, lang: template.lang, isActive: true },
      data: { isActive: false },
    });

    const activated = await templateDb.update({
      where: { id },
      data: { isActive: true },
    });

    this.templateCache.clear();
    this.logger.log(`Activated template ${id} for ${template.type}/${template.channel}/${template.lang}`);
    return activated;
  }

  async getTemplateVariables(type: string, channel: string): Promise<string[]> {
    const template = await this.getTemplate(type, channel, 'ar');
    if (!template?.variables) return [];

    if (typeof template.variables === 'object') {
      return Object.keys(template.variables);
    }

    const vars = new Set<string>();
    const regex = /\{\{(\w+)\}\}/g;
    const fields = [template.titleAr, template.titleEn, template.bodyAr, template.bodyEn];
    for (const field of fields) {
      if (field) {
        let match;
        while ((match = regex.exec(field)) !== null) {
          vars.add(match[1]);
        }
      }
    }

    return Array.from(vars);
  }

  async validateTemplate(template: any, variables: Record<string, any>): Promise<{ valid: boolean; missing: string[] }> {
    const requiredVars = await this.getTemplateVariables(template.type, template.channel);
    const missing = requiredVars.filter((v) => variables[v] === undefined || variables[v] === null);
    return { valid: missing.length === 0, missing };
  }

  async renderPreview(type: string, channel: string, lang: string, variables: Record<string, any>): Promise<{
    titleAr: string;
    titleEn: string;
    bodyAr: string;
    bodyEn: string;
    smsBodyAr?: string;
    smsBodyEn?: string;
    pushTitleAr?: string;
    pushTitleEn?: string;
    pushBodyAr?: string;
    pushBodyEn?: string;
  }> {
    const template = await this.getTemplate(type, channel, lang);
    if (!template) throw new NotFoundException(`No active template found for ${type}/${channel}/${lang}`);

    const validation = await this.validateTemplate(template, variables);
    if (!validation.valid) {
      throw new BadRequestException(`Missing required variables: ${validation.missing.join(', ')}`);
    }

    const renderField = async (field: string) => field ? this.render(field, variables) : undefined;

    return {
      titleAr: await renderField(template.titleAr) as string,
      titleEn: await renderField(template.titleEn) as string,
      bodyAr: await renderField(template.bodyAr) as string,
      bodyEn: await renderField(template.bodyEn) as string,
      smsBodyAr: template.smsBodyAr ? await renderField(template.smsBodyAr) as string : undefined,
      smsBodyEn: template.smsBodyEn ? await renderField(template.smsBodyEn) as string : undefined,
      pushTitleAr: template.pushTitleAr ? await renderField(template.pushTitleAr) as string : undefined,
      pushTitleEn: template.pushTitleEn ? await renderField(template.pushTitleEn) as string : undefined,
      pushBodyAr: template.pushBodyAr ? await renderField(template.pushBodyAr) as string : undefined,
      pushBodyEn: template.pushBodyEn ? await renderField(template.pushBodyEn) as string : undefined,
    };
  }
}


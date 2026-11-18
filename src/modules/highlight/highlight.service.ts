import {
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryBuilder } from '../../common/helpers/mongodb-query-builder.helper';
import { IQueryFeatures } from '../../common/interfaces/query-feature.interface';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { UpdateHighlightDto } from './dto/update-highlight.dto';
import {
  HIGHLIGHT_VALUE_SIGNS,
  Highlight,
  HighlightDocument,
  HighlightItem,
  HighlightValueSign,
} from './entities/highlight.entity';

/** Legacy item shape before sectionKey/slug removal and numeric values. */
interface LegacyItem {
  icon?: string;
  value?: string | number | null;
  valueSign?: string;
  label?: string;
  sublabel?: string;
  description?: string;
  richText?: string;
}

@Injectable()
export class HighlightService implements OnApplicationBootstrap {
  private readonly logger = new Logger(HighlightService.name);

  constructor(
    @InjectModel(Highlight.name)
    private readonly highlightModel: Model<HighlightDocument>,
  ) {}

  /**
   * Idempotent migration from the old shape:
   * - drop the old unique (organizationId, slug) and sectionKey indexes
   *   (otherwise every new doc without a slug collides on `null`)
   * - unset sectionKey/slug
   * - items: sublabel -> description, "16+ Years" -> value 16 + valueSign "+"
   */
  async onApplicationBootstrap() {
    const collection = this.highlightModel.collection;
    for (const name of [
      'organizationId_1_slug_1',
      'organizationId_1_sectionKey_1',
    ]) {
      try {
        await collection.dropIndex(name);
        this.logger.log(`Dropped legacy index ${name}`);
      } catch {
        // index not present: already migrated
      }
    }

    try {
      const legacy = await collection
        .find({
          $or: [
            { sectionKey: { $exists: true } },
            { slug: { $exists: true } },
            { 'items.sublabel': { $exists: true } },
            { 'items.richText': { $exists: true } },
            { 'items.value': { $type: 'string' } },
          ],
        })
        .toArray();

      for (const doc of legacy) {
        const items = ((doc.items as LegacyItem[]) || []).map((it) =>
          this.migrateItem(it),
        );
        await collection.updateOne(
          { _id: doc._id },
          { $set: { items }, $unset: { sectionKey: '', slug: '' } },
        );
      }
      if (legacy.length > 0) {
        this.logger.log(`Migrated ${legacy.length} highlight section(s)`);
      }
    } catch (err) {
      this.logger.error('Highlight migration failed', err as Error);
    }
  }

  private migrateItem(it: LegacyItem): HighlightItem {
    let value: number | null = null;
    let valueSign: HighlightValueSign = '';
    if (typeof it.value === 'number') {
      value = it.value;
      valueSign = this.asSign(it.valueSign);
    } else if (typeof it.value === 'string' && it.value.trim()) {
      const match = it.value.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
      value = match ? Number(match[0]) : null;
      const rest = match
        ? it.value.replace(/,/g, '').slice(match.index! + match[0].length)
        : it.value;
      const signMatch = rest.trim().match(/^(K\+|M\+|K|M|\+|-|\*|%|x)/i);
      valueSign = this.asSign(signMatch?.[0]?.toUpperCase().replace('X', 'x'));
    }
    return {
      label: (it.label || '').trim() || 'Untitled',
      description: it.description ?? it.sublabel ?? '',
      value,
      valueSign,
      icon: it.icon || '',
    };
  }

  private asSign(sign?: string): HighlightValueSign {
    return (HIGHLIGHT_VALUE_SIGNS as readonly string[]).includes(sign ?? '')
      ? (sign as HighlightValueSign)
      : '';
  }

  async create(organizationId: string, createDto: CreateHighlightDto) {
    return this.highlightModel.create({
      ...createDto,
      organizationId: new Types.ObjectId(organizationId),
    });
  }

  async findAll(organizationId: string, query: IQueryFeatures) {
    const queryBuilder = new QueryBuilder(this.highlightModel, query, {
      searchFields: ['badge', 'sectionTitle', 'sectionDescription'],
    });

    if (organizationId) {
      queryBuilder.addFilterQuery({
        organizationId: new Types.ObjectId(organizationId),
      });
    }

    return await queryBuilder.execute();
  }

  async findOne(id: string, organizationId: string) {
    const highlight = await this.highlightModel
      .findOne(this.idFilter(id, organizationId))
      .exec();
    if (!highlight) {
      throw new NotFoundException('Highlight section not found');
    }
    return highlight;
  }

  /** Active + public sections for the website, oldest first. */
  async findAllPublic(organizationId?: string) {
    const filter: Record<string, unknown> = { isActive: true, isPublic: true };
    if (organizationId && Types.ObjectId.isValid(organizationId)) {
      filter.organizationId = new Types.ObjectId(organizationId);
    }
    return this.highlightModel
      .find(filter)
      .sort({ createdAt: 1 })
      .lean()
      .exec();
  }

  async update(
    id: string,
    organizationId: string,
    updateDto: UpdateHighlightDto,
  ) {
    const updated = await this.highlightModel
      .findOneAndUpdate(
        this.idFilter(id, organizationId),
        { $set: updateDto },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Highlight section not found');
    }
    return updated;
  }

  async remove(id: string, organizationId: string) {
    const deleted = await this.highlightModel
      .findOneAndDelete(this.idFilter(id, organizationId))
      .exec();
    if (!deleted) {
      throw new NotFoundException('Highlight section not found');
    }
    return deleted;
  }

  private idFilter(id: string, organizationId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Highlight section not found');
    }
    return {
      _id: new Types.ObjectId(id),
      organizationId: new Types.ObjectId(organizationId),
    };
  }
}

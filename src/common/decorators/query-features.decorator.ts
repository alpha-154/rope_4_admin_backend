import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { isObjectIdOrHexString, Types } from 'mongoose';
import { IQueryFeatures } from '../interfaces/query-feature.interface';

type TDocumentNumber = 'single' | 'multiple';

const getQueryFeatureContext = (
  context: ExecutionContext,
  documentNumber: TDocumentNumber,
) => {
  const req = context.switchToHttp().getRequest();
  const fieldsObj: { [key: string]: number } = {};

  if (req.query.fields) {
    let fields = String(req.query.fields);
    fields = fields.split(',').join(' ');
    fields.split(' ').forEach((el) => {
      fieldsObj[el] = 1;
    });
  }

  if (documentNumber === 'single') {
    const populate: string = req.query.populate
      ? String(req.query.populate).split(',').join(' ')
      : '';
    const queryFeaturesObj: Partial<IQueryFeatures> = {
      fields: fieldsObj,
      populate,
    };
    return queryFeaturesObj;
  } else {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const search: string = req.query.search ? String(req.query.search) : '';

    let sort = req.query.sort ? String(req.query.sort) : undefined;
    const sortObj: { [key: string]: 1 | -1 } = {};

    if (sort) {
      sort = sort.split(',').join(' ');
      sort.split(' ').forEach((el) => {
        if (el.startsWith('-')) {
          sortObj[el.slice(1)] = -1;
        } else {
          sortObj[el] = 1;
        }
      });
    } else {
      sortObj.createdAt = -1;
    }

    const query: Record<string, any> = req.query;
    const filters: { [key: string]: any } = { ...query };

    const excludedFields = [
      'page',
      'sort',
      'limit',
      'fields',
      'search',
      'populate',
    ];

    excludedFields.forEach((el) => delete filters[el]);

    Object.keys(filters).forEach((key) => {
      if (filters[key] === 'true') {
        filters[key] = true;
      } else if (filters[key] === 'false') {
        filters[key] = false;
      } else if (isObjectIdOrHexString(filters[key])) {
        filters[key] = new Types.ObjectId(filters[key]);
      }
    });

    const populateObj: { [key: string]: boolean } = {};
    if (req.query.populate) {
      let populate = String(req.query.populate);
      populate = populate.split(',').join(' ');
      populate.split(' ').forEach((el) => {
        populateObj[el] = true;
      });
    }

    const queryFeaturesObj: IQueryFeatures = {
      page,
      limit,
      skip,
      fields: fieldsObj,
      filters,
      sort: sortObj,
      search,
      populate: populateObj,
    };

    return queryFeaturesObj;
  }
};

export const QueryFeatureMultiple = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getQueryFeatureContext(context, 'multiple'),
);

export const QueryFeatureSingle = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getQueryFeatureContext(context, 'single'),
);

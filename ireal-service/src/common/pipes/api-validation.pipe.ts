import { HttpStatus, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { ApiHttpException } from '../envelope';

const flattenValidationErrors = (
  errors: ValidationError[],
): Array<{
  field: string;
  constraints: string[];
}> =>
  errors.reduce<Array<{ field: string; constraints: string[] }>>(
    (acc, error) => {
      const constraints = error.constraints
        ? Object.values(error.constraints)
        : [];

      if (constraints.length > 0) {
        acc.push({
          field: error.property,
          constraints,
        });
      }

      if (error.children?.length) {
        acc.push(...flattenValidationErrors(error.children));
      }

      return acc;
    },
    [],
  );

export const createValidationPipe = (): ValidationPipe =>
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (validationErrors: ValidationError[]) => {
      const flattened = flattenValidationErrors(validationErrors);

      return new ApiHttpException(
        'VALIDATION_ERROR',
        'Validation failed',
        HttpStatus.BAD_REQUEST,
        undefined,
        { errors: flattened },
      );
    },
  });

export const __test__ = {
  flattenValidationErrors,
};

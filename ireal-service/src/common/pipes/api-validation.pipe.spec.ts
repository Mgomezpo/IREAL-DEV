import { HttpStatus } from '@nestjs/common';
import { IsString } from 'class-validator';
import { ApiHttpException } from '../envelope';
import { createValidationPipe } from './api-validation.pipe';

class SampleDto {
  @IsString()
  value!: string;
}

describe('createValidationPipe', () => {
  it('allows valid payloads', async () => {
    const pipe = createValidationPipe();
    const dto = (await pipe.transform(
      { value: 'test' },
      { type: 'body', metatype: SampleDto },
    )) as SampleDto;

    expect(dto).toBeInstanceOf(SampleDto);
    expect(dto.value).toBe('test');
  });

  it('throws ApiHttpException on validation failure', async () => {
    const pipe = createValidationPipe();

    expect.assertions(3);
    try {
      await pipe.transform({}, { type: 'body', metatype: SampleDto });
    } catch (error) {
      expect(error).toBeInstanceOf(ApiHttpException);
      const apiError = error as ApiHttpException;
      expect(apiError.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      const response = apiError.getResponse() as {
        error: { code: string };
      };
      expect(response.error.code).toBe('VALIDATION_ERROR');
      return;
    }

    throw new Error('Expected validation error');
  });
});

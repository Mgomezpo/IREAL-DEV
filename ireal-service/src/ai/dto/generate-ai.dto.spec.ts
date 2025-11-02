import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  GENERATE_AI_TYPES,
  GenerateAiDto,
  GenerateAiType,
} from './generate-ai.dto';

describe('GenerateAiDto validation', () => {
  it('rejects payload without prompt', async () => {
    const dto = plainToInstance(GenerateAiDto, {});
    const errors = await validate(dto);

    expect(errors).not.toHaveLength(0);
    expect(errors[0]?.property).toBe('prompt');
  });

  it('rejects payload with invalid type', async () => {
    const dto = plainToInstance(GenerateAiDto, {
      prompt: 'hola',
      type: 'invalid',
    });
    const errors = await validate(dto);

    expect(errors).not.toHaveLength(0);
    expect(errors.some((error) => error.property === 'type')).toBe(true);
  });

  it.each(GENERATE_AI_TYPES)(
    'accepts prompt and type "%s"',
    async (type: GenerateAiType) => {
      const dto = plainToInstance(GenerateAiDto, {
        prompt: 'hola',
        type,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    },
  );
});

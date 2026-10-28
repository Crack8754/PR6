import { Transform } from 'class-transformer';
import { IsString, IsUUID, Length, MaxLength, ValidateIf } from 'class-validator';

export class UpdateEventDto {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 200)
  title?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase() : value)
  @IsUUID()
  categoryId?: string;
}

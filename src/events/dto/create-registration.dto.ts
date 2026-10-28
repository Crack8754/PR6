import { Transform } from 'class-transformer';
import { IsUUID } from 'class-validator';

export class CreateRegistrationDto {
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase() : value)
  @IsUUID()
  participantId!: string;
}

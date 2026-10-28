import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CampusRepository } from './campus.repository';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CampusEvent, Registration } from './models';

@Injectable()
export class EventsService {
  constructor(private readonly repository: CampusRepository) {}

  create(dto: CreateEventDto): CampusEvent {
    this.requireCategory(dto.categoryId);
    const now = new Date().toISOString();
    return this.repository.saveEvent({
      id: randomUUID(), title: dto.title, description: dto.description ?? '',
      categoryId: dto.categoryId, createdAt: now, updatedAt: now,
    });
  }

  findAll(): CampusEvent[] { return this.repository.findEvents(); }

  findCategories() { return this.repository.findCategories(); }

  findOne(id: string): CampusEvent {
    const event = this.repository.findEvent(id.toLowerCase());
    if (!event) throw new NotFoundException({
      errorCode: 'EVENT_NOT_FOUND', message: `Event with id ${id} was not found`,
    });
    return event;
  }

  update(id: string, dto: UpdateEventDto): CampusEvent {
    const event = this.findOne(id);
    if (dto.title === undefined && dto.description === undefined && dto.categoryId === undefined) {
      throw new BadRequestException({ errorCode: 'EMPTY_UPDATE', message: 'Provide title, description or categoryId to update' });
    }
    if (dto.categoryId !== undefined) this.requireCategory(dto.categoryId);
    return this.repository.saveEvent({
      ...event,
      title: dto.title ?? event.title,
      description: dto.description ?? event.description,
      categoryId: dto.categoryId ?? event.categoryId,
      updatedAt: new Date(Math.max(Date.now(), Date.parse(event.updatedAt) + 1)).toISOString(),
    });
  }

  remove(id: string): void {
    const event = this.findOne(id);
    this.repository.removeEvent(event.id);
  }

  register(id: string, dto: CreateRegistrationDto): Registration {
    const event = this.findOne(id);
    if (this.repository.hasRegistration(event.id, dto.participantId)) {
      throw new ConflictException({
        errorCode: 'REGISTRATION_EXISTS', message: 'Participant is already registered for this event',
      });
    }
    // Усі операції синхронні: перевірка та запис не перериваються іншим запитом.
    return this.repository.saveRegistration({
      id: randomUUID(), eventId: event.id,
      participantId: dto.participantId, createdAt: new Date().toISOString(),
    });
  }

  findRegistrations(id: string): Registration[] {
    return this.repository.findRegistrations(this.findOne(id).id);
  }

  findRegistration(eventId: string, registrationId: string): Registration {
    const event = this.findOne(eventId);
    const registration = this.repository.findRegistration(event.id, registrationId.toLowerCase());
    if (!registration) throw new NotFoundException({
      errorCode: 'REGISTRATION_NOT_FOUND', message: 'Registration was not found for this event',
    });
    return registration;
  }

  private requireCategory(id: string): void {
    if (!this.repository.hasCategory(id)) throw new BadRequestException({
      errorCode: 'CATEGORY_NOT_FOUND', message: `Category with id ${id} was not found`,
    });
  }
}

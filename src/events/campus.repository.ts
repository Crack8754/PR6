import { Injectable } from '@nestjs/common';
import { CampusEvent, Category, Registration } from './models';

@Injectable()
export class CampusRepository {
  private readonly categories = new Map<string, Category>([
    ['11111111-1111-4111-8111-111111111111', { id: '11111111-1111-4111-8111-111111111111', name: 'Лекції' }],
    ['22222222-2222-4222-8222-222222222222', { id: '22222222-2222-4222-8222-222222222222', name: 'Зустрічі' }],
    ['33333333-3333-4333-8333-333333333333', { id: '33333333-3333-4333-8333-333333333333', name: 'Майстер-класи' }],
  ]);
  private readonly events = new Map<string, CampusEvent>();
  private readonly registrations = new Map<string, Registration>();

  findCategories(): Category[] { return [...this.categories.values()].map((item) => ({ ...item })); }
  hasCategory(id: string): boolean { return this.categories.has(id); }
  findEvents(): CampusEvent[] { return [...this.events.values()].map((item) => ({ ...item })); }
  findEvent(id: string): CampusEvent | undefined {
    const event = this.events.get(id);
    return event ? { ...event } : undefined;
  }
  saveEvent(event: CampusEvent): CampusEvent {
    this.events.set(event.id, { ...event });
    return { ...event };
  }
  removeEvent(id: string): void {
    this.events.delete(id);
    for (const [registrationId, registration] of this.registrations) {
      if (registration.eventId === id) this.registrations.delete(registrationId);
    }
  }
  findRegistrations(eventId: string): Registration[] {
    return [...this.registrations.values()].filter((item) => item.eventId === eventId).map((item) => ({ ...item }));
  }
  findRegistration(eventId: string, id: string): Registration | undefined {
    const item = this.registrations.get(id);
    return item?.eventId === eventId ? { ...item } : undefined;
  }
  hasRegistration(eventId: string, participantId: string): boolean {
    return [...this.registrations.values()].some((item) =>
      item.eventId === eventId && item.participantId === participantId);
  }
  saveRegistration(registration: Registration): Registration {
    this.registrations.set(registration.id, { ...registration });
    return { ...registration };
  }
}

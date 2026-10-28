export interface Category { id: string; name: string; }

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  participantId: string;
  createdAt: string;
}

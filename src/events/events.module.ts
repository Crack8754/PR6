import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { CategoriesController } from './categories.controller';
import { EventsService } from './events.service';
import { CampusRepository } from './campus.repository';

@Module({
  controllers: [EventsController, CategoriesController],
  providers: [EventsService, CampusRepository],
})
export class EventsModule {}

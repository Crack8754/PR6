import { Controller, Get } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: EventsService) {}
  @Get()
  findAll() { return this.service.findCategories(); }
}

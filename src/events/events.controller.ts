import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Res } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { EventsService } from './events.service';

// Використовується лише встановлення HTTP-заголовка; Nest сам серіалізує тіло.
interface ResponseHeaders { setHeader(name: string, value: string): unknown; }

@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Post()
  create(@Body() dto: CreateEventDto, @Res({ passthrough: true }) response: ResponseHeaders) {
    const event = this.service.create(dto);
    response.setHeader('Location', `/events/${event.id}`);
    return event;
  }

  @Get()
  findAll() { return this.service.findAll(); }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.service.findOne(id); }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEventDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string): void { this.service.remove(id); }

  @Post(':id/registrations')
  register(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateRegistrationDto,
    @Res({ passthrough: true }) response: ResponseHeaders) {
    const registration = this.service.register(id, dto);
    response.setHeader('Location', `/events/${registration.eventId}/registrations/${registration.id}`);
    return registration;
  }

  @Get(':id/registrations')
  findRegistrations(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findRegistrations(id);
  }

  @Get(':id/registrations/:registrationId')
  findRegistration(@Param('id', ParseUUIDPipe) id: string,
    @Param('registrationId', ParseUUIDPipe) registrationId: string) {
    return this.service.findRegistration(id, registrationId);
  }
}

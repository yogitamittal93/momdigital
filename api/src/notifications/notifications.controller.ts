import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /notifications — full list, newest first */
  @Get()
  list(@Request() req: { user: { id: string } }) {
    return this.notificationsService.listForUser(req.user.id);
  }

  /** GET /notifications/unread-count — just the badge number */
  @Get('unread-count')
  unreadCount(@Request() req: { user: { id: string } }) {
    return this.notificationsService
      .getUnreadCount(req.user.id)
      .then((count) => ({ count }));
  }

  /** PATCH /notifications/read-all — bulk mark all as read */
  @Patch('read-all')
  markAllRead(@Request() req: { user: { id: string } }) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  /** PATCH /notifications/:id/read — mark one as read */
  @Patch(':id/read')
  markRead(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.notificationsService.markRead(req.user.id, id);
  }
}

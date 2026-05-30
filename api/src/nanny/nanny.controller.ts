import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/jwt.gaurd';
import { NannyService } from './nanny.service';

@Controller('nanny')
@UseGuards(JwtGuard)
export class NannyController {
  constructor(private readonly nannyService: NannyService) {}

  @Post('checklists')
  create(
    @Req() req: { user: { id: string } },
    @Body() body: { nannyName?: string },
  ) {
    return this.nannyService.createChecklist(req.user.id, body.nannyName);
  }

  @Get('checklists')
  list(@Req() req: { user: { id: string } }) {
    return this.nannyService.listChecklists(req.user.id);
  }

  @Get('checklists/:id')
  getOne(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.nannyService.ensureTodayLogs(id, req.user.id);
  }

  @Patch('checklists/:id/checks')
  toggle(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
    @Body()
    body: {
      checkItem: string;
      dayNumber: number;
      completed: boolean;
      note?: string;
    },
  ) {
    return this.nannyService.toggleCheck(
      id,
      req.user.id,
      body.checkItem,
      body.dayNumber,
      body.completed,
      body.note,
    );
  }
}

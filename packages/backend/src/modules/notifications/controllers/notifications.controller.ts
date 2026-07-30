import {
  Controller, Get, Post, Patch, Put, Delete,
  Param, Query, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam, ApiQuery, ApiBody,
} from '@nestjs/swagger';
import { NotificationsService } from '../notifications.service';
import { NotificationPreferenceService } from '../preference.service';
import { NotificationTemplateService } from '../template.service';
import { NotificationAnalyticsService } from '../analytics.service';
import { SendNotificationDto, SendBulkDto, SendToRoleDto, CreateCampaignDto, TestChannelDto, UpdateChannelConfigDto, BulkRetryDto, QuietHoursDto, NotificationQueryDto, CreateTemplateDto, ScheduledQueryDto } from '../dto/notifications.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Roles, CurrentUser } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { NotificationType, NotificationChannel } from '@prisma/client';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly preferenceService: NotificationPreferenceService,
    private readonly templateService: NotificationTemplateService,
    private readonly analyticsService: NotificationAnalyticsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated user notifications (filterable by type, channel, read status)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiQuery({ name: 'channel', required: false, enum: NotificationChannel })
  @ApiQuery({ name: 'read', required: false, description: 'Filter by read status (true/false)' })
  async findAll(
    @CurrentUser('sub') userId: string,
    @Query() query: PaginationDto & { type?: NotificationType; channel?: NotificationChannel; read?: string },
  ) {
    const result = await this.notificationsService.findAll(userId, query);
    return { success: true, ...result, pagination: result.meta };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count for current user' })
  async getUnreadCount(@CurrentUser('sub') userId: string) {
    const data = await this.notificationsService.getUnreadCount(userId);
    return { success: true, data };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user notification stats (sent, delivered, read counts)' })
  async getStats(@CurrentUser('sub') userId: string) {
    const data = await this.notificationsService.getStats(userId);
    return { success: true, data };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get full delivery history with channel logs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async getHistory(@CurrentUser('sub') userId: string, @Query() query: any) {
    const data = await this.notificationsService.getNotificationHistory(userId, query);
    return { success: true, ...data };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@Param('id') id: string) {
    const data = await this.notificationsService.markAsRead(id);
    return { success: true, data };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  async markAllAsRead(@CurrentUser('sub') userId: string) {
    const result = await this.notificationsService.markAllAsRead(userId);
    return { success: true, message: result.message };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete (soft) a notification' })
  async delete(@Param('id') id: string) {
    const result = await this.notificationsService.delete(id);
    return { success: true, message: result.message };
  }

  @Post(':id/resend')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Resend a failed notification' })
  async resend(@Param('id') id: string) {
    const notification = await this.notificationsService.findOne(id);
    const data = await this.notificationsService.send(notification.userId, notification.type, (notification.data || {}) as Record<string, any>);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification details by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.notificationsService.findOne(id);
    return { success: true, data };
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get current user notification preferences' })
  async getPreferences(@CurrentUser('sub') userId: string) {
    const data = await this.preferenceService.getPreferences(userId);
    return { success: true, data };
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update bulk notification preferences' })
  async updatePreferences(
    @CurrentUser('sub') userId: string,
    @Body() preferences: { channel: string; type: string; enabled: boolean }[],
  ) {
    const data = await this.preferenceService.updateBulkPreferences(userId, preferences);
    return { success: true, data };
  }

  @Put('preferences/:channel/:type')
  @ApiOperation({ summary: 'Update single channel/type preference toggle' })
  async updateSinglePreference(
    @CurrentUser('sub') userId: string,
    @Param('channel') channel: string,
    @Param('type') type: string,
    @Body('enabled') enabled: boolean,
  ) {
    const data = await this.preferenceService.updatePreference(userId, channel, type, enabled);
    return { success: true, data };
  }

  @Put('preferences/quiet-hours')
  @ApiOperation({ summary: 'Set quiet hours for a channel' })
  async setQuietHours(
    @CurrentUser('sub') userId: string,
    @Body() body: { channel: string; start: string; end: string },
  ) {
    const data = await this.preferenceService.setQuietHours(userId, body.channel, body.start, body.end);
    return { success: true, data };
  }

  @Put('preferences/max-per-day')
  @ApiOperation({ summary: 'Set max notifications per day for a channel' })
  async setMaxPerDay(
    @CurrentUser('sub') userId: string,
    @Body() body: { channel: string; max: number },
  ) {
    const data = await this.preferenceService.setMaxPerDay(userId, body.channel, body.max);
    return { success: true, data };
  }

  @Get('preferences/subscribed-types')
  @ApiOperation({ summary: 'Get list of notification types the user is subscribed to' })
  async getSubscribedTypes(@CurrentUser('sub') userId: string) {
    const data = await this.preferenceService.getSubscribedTypes(userId);
    return { success: true, data };
  }

  @Get('templates')
  @ApiOperation({ summary: 'List notification templates (filtered by type/channel)' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'channel', required: false })
  @ApiQuery({ name: 'lang', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listTemplates(@Query() query: any) {
    const data = await this.templateService.getAllTemplates(query);
    return { success: true, ...data };
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get a single notification template' })
  async getTemplate(@Param('id') id: string) {
    const templateDb = (this.templateService as any).prisma?.notificationTemplate;
    const data = templateDb ? await templateDb.findUnique({ where: { id } }) : null;
    return { success: true, data };
  }

  @Post('templates')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new notification template' })
  async createTemplate(@Body() dto: any) {
    const data = await this.templateService.createTemplate(dto);
    return { success: true, data };
  }

  @Patch('templates/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update a notification template' })
  async updateTemplate(@Param('id') id: string, @Body() dto: any) {
    const data = await this.templateService.updateTemplate(id, dto);
    return { success: true, data };
  }

  @Post('templates/:id/activate')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a template version (deactivates others of same type/channel/lang)' })
  async activateTemplate(@Param('id') id: string) {
    const data = await this.templateService.activateTemplate(id);
    return { success: true, data };
  }

  @Post('templates/render')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview a rendered template with test variables' })
  async renderPreview(
    @Body() body: { type: string; channel: string; lang: string; variables: Record<string, any> },
  ) {
    const data = await this.templateService.renderPreview(body.type, body.channel, body.lang, body.variables);
    return { success: true, data };
  }

  @Post('send')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a single notification to a user' })
  async send(@Body() dto: SendNotificationDto) {
    const data = await this.notificationsService.send(dto.userId, dto.type, dto.data as Record<string, any>, dto.channels, dto.priority, dto.scheduledAt ? new Date(dto.scheduledAt) : undefined);
    return { success: true, data };
  }

  @Post('send/bulk')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send bulk notifications to multiple users' })
  async sendBulk(@Body() dto: SendBulkDto) {
    const data = await this.notificationsService.sendToMany(dto.userIds, dto.type, dto.data as Record<string, any>, dto.channels);
    return { success: true, data };
  }

  @Post('send/role')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send notification to all users of a given role' })
  async sendToRole(@Body() dto: SendToRoleDto) {
    const data = await this.notificationsService.sendToRole(dto.role, dto.type, dto.data as Record<string, any>, dto.channels);
    return { success: true, data };
  }

  @Post('schedule')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule a notification for future delivery' })
  async schedule(@Body() dto: any) {
    const data = await this.notificationsService.schedule(dto);
    return { success: true, data };
  }

  @Delete('schedule/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Cancel a scheduled notification' })
  async cancelScheduled(@Param('id') id: string) {
    const data = await this.notificationsService.cancel(id);
    return { success: true, data };
  }

  @Get('admin/dashboard')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin dashboard stats (sent today, rate, pending, failed)' })
  async adminDashboard() {
    const data = await this.notificationsService.getNotificationStats();
    return { success: true, data };
  }

  @Get('admin/failed')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get list of failed notifications' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFailed(@Query() query: PaginationDto) {
    const data = await this.notificationsService.getFailed(query);
    return { success: true, ...data };
  }

  @Post('admin/retry/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually retry a failed notification' })
  async retryFailed(@Param('id') id: string) {
    const data = await this.notificationsService.retry(id);
    return { success: true, data };
  }

  @Post('admin/retry/all')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk retry all failed notifications' })
  async retryAllFailed() {
    const data = await this.notificationsService.retryAll();
    return { success: true, data };
  }

  @Get('admin/channels')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get channel configurations and status' })
  async getChannelConfigs() {
    const data = await this.notificationsService.getChannelConfigs();
    return { success: true, data };
  }

  @Put('admin/channels/:channel')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update channel configuration (enable/disable, rate limits)' })
  async updateChannelConfig(@Param('channel') channel: string, @Body() config: any) {
    const data = await this.notificationsService.updateChannelConfig(channel, config);
    return { success: true, data };
  }

  @Post('admin/channels/:channel/test')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Send a test notification through a specific channel' })
  async testChannel(@Param('channel') channel: string, @Body() body: { recipient: string; message: string }) {
    const data = await this.notificationsService.testChannel(channel, body.recipient, body.message);
    return { success: true, data };
  }

  @Post('admin/campaigns')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new notification campaign' })
  async createCampaign(@Body() dto: any) {
    const data = await this.notificationsService.createCampaign(dto);
    return { success: true, data };
  }

  @Get('admin/campaigns')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List all notification campaigns' })
  async listCampaigns(@Query() query: PaginationDto) {
    const data = await this.notificationsService.listCampaigns(query);
    return { success: true, ...data };
  }

  @Get('analytics/channel-performance')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Channel performance analytics (delivery rates by channel)' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async channelPerformance(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    const data = await this.analyticsService.getChannelPerformance(dateFrom, dateTo);
    return { success: true, data };
  }

  @Get('analytics/type-breakdown')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Notification type breakdown (sent/read per type)' })
  async typeBreakdown(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    const data = await this.analyticsService.getTypeBreakdown(dateFrom, dateTo);
    return { success: true, data };
  }

  @Get('analytics/hourly')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Hourly distribution of notifications' })
  async hourlyDistribution(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    const data = await this.analyticsService.getHourlyDistribution(dateFrom, dateTo);
    return { success: true, data };
  }

  @Get('analytics/daily')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Daily notification stats over a date range' })
  async dailyStats(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    const data = await this.analyticsService.getDailyStats(dateFrom, dateTo);
    return { success: true, data };
  }

  @Get('analytics/dashboard')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Executive analytics dashboard (summary, channels, types, daily, failed types)' })
  async analyticsDashboard() {
    const data = await this.analyticsService.getAnalyticsDashboard();
    return { success: true, data };
  }

  @Get('analytics/delivery-time')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Average delivery time per channel' })
  async deliveryTime(@Query('channel') channel?: string) {
    const data = await this.analyticsService.getDeliveryTimeStats(channel);
    return { success: true, data };
  }

  @Get('analytics/user-engagement')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'User engagement metrics (read rate, weekly activity)' })
  async userEngagement(@Query('userId') userId?: string) {
    const data = await this.analyticsService.getUserEngagement(userId);
    return { success: true, data };
  }

  @Get('logs/sms')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getSmsLogs(@Query() pagination: PaginationDto, @Query('status') status?: string, @Query('recipientNumber') recipientNumber?: string, @Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    const result = await this.notificationsService.getSmsLogs(pagination, { status, recipientNumber, dateFrom, dateTo });
    return { success: true, ...result, pagination: result.meta };
  }

  @Get('logs/email')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getEmailLogs(@Query() pagination: PaginationDto, @Query('status') status?: string, @Query('recipientEmail') recipientEmail?: string, @Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    const result = await this.notificationsService.getEmailLogs(pagination, { status, recipientEmail, dateFrom, dateTo });
    return { success: true, ...result, pagination: result.meta };
  }

  @Get('logs/whatsapp')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getWhatsAppLogs(@Query() pagination: PaginationDto, @Query('status') status?: string, @Query('recipientNumber') recipientNumber?: string, @Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    const result = await this.notificationsService.getWhatsAppLogs(pagination, { status, recipientNumber, dateFrom, dateTo });
    return { success: true, ...result, pagination: result.meta };
  }
}

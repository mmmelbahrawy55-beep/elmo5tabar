import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CmsPostService } from './services/cms-post.service';
import { CmsWorkflowService } from './services/cms-workflow.service';
import { CmsAnalyticsService } from './services/cms-analytics.service';
import { CmsMediaService } from './services/cms-media.service';
import { CmsNewsletterService } from './services/cms-newsletter.service';
import { CmsCommentService } from './services/cms-comment.service';
import { CreatePostDto, UpdatePostDto, PostQueryDto, CreateCategoryDto, CreateAuthorDto, CreateCommentDto, CommentModerationDto, NewsletterSubscribeDto, CreateCampaignDto, WorkflowActionDto, RelatePostsDto, CmsDashboardDto, MediaUploadDto } from './dto/cms.dto';

@ApiTags('CMS')
@Controller('cms')
export class CmsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postService: CmsPostService,
    private readonly workflowService: CmsWorkflowService,
    private readonly analyticsService: CmsAnalyticsService,
    private readonly mediaService: CmsMediaService,
    private readonly newsletterService: CmsNewsletterService,
    private readonly commentService: CmsCommentService,
  ) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get CMS dashboard stats' })
  async getDashboard(@Query() query: CmsDashboardDto) {
    return this.analyticsService.getDashboard(query.days || 30);
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  async createPost(@Body() dto: CreatePostDto, @Req() req: any) {
    return this.postService.create(dto, req.user.id);
  }

  @Get('posts')
  @ApiOperation({ summary: 'Get all posts' })
  async getPosts(@Query() query: PostQueryDto) {
    return this.postService.findAll(query);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Get a post by ID' })
  async getPost(@Param('id') id: string) {
    return this.postService.findOne(id);
  }

  @Get('posts/slug/:slug')
  @ApiOperation({ summary: 'Get a post by slug' })
  async getPostBySlug(@Param('slug') slug: string) {
    return this.postService.findBySlug(slug);
  }

  @Put('posts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  async updatePost(@Param('id') id: string, @Body() dto: UpdatePostDto, @Req() req: any) {
    return this.postService.update(id, dto, req.user.id);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a post' })
  async deletePost(@Param('id') id: string) {
    return this.postService.remove(id);
  }

  @Post('posts/:id/workflow')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute workflow action on post' })
  async workflowAction(@Param('id') id: string, @Body() dto: WorkflowActionDto, @Req() req: any) {
    return this.workflowService.transition(id, dto.action, req.user.id, dto.notes, dto.scheduledAt);
  }

  @Get('posts/:id/revisions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get post revisions' })
  async getRevisions(@Param('id') id: string) {
    return this.workflowService.getRevisions(id);
  }

  @Post('posts/:id/revisions/:version/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a post revision' })
  async restoreRevision(@Param('id') id: string, @Param('version') version: string, @Req() req: any) {
    return this.workflowService.restoreRevision(id, parseInt(version), req.user.id);
  }

  @Post('posts/:id/relations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Relate posts' })
  async relatePost(@Param('id') id: string, @Body() dto: RelatePostsDto) {
    return this.postService.createRelation(id, dto.targetId, dto.type, dto.weight);
  }

  @Delete('relations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove post relation' })
  async removeRelation(@Param('id') id: string) {
    return this.postService.removeRelation(id);
  }

  @Post('posts/:id/view')
  @ApiOperation({ summary: 'Track post view' })
  async trackView(@Param('id') id: string, @Req() req: any) {
    return this.analyticsService.trackView(id, req.ip, req.headers['cf-ipcountry'], req.headers.referer);
  }

  @Post('posts/:id/share')
  @ApiOperation({ summary: 'Track post share' })
  async trackShare(@Param('id') id: string) {
    return this.analyticsService.trackShare(id);
  }

  @Post('comments')
  @ApiOperation({ summary: 'Create a comment' })
  async createComment(@Body() dto: CreateCommentDto, @Req() req: any) {
    return this.commentService.create({ ...dto, userId: req.user?.id });
  }

  @Post('comments/:id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Moderate a comment' })
  async moderateComment(@Param('id') id: string, @Body() dto: CommentModerationDto) {
    return this.commentService.moderate(id, dto.action as any);
  }

  @Get('comments/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending comments' })
  async getPendingComments(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.commentService.findPending(page, limit);
  }

  @Get('posts/:id/comments')
  @ApiOperation({ summary: 'Get comments for a post' })
  async getPostComments(@Param('id') id: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.commentService.findByPost(id, page, limit);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment' })
  async deleteComment(@Param('id') id: string) {
    return this.commentService.delete(id);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a category' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    const data: any = { ...dto, parentId: dto.parentId || null };
    return this.prisma.contentCategory.create({ data });
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  async getCategories() {
    return this.prisma.contentCategory.findMany({ where: { parentId: null }, include: { children: true }, orderBy: { displayOrder: 'asc' } });
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  async getCategory(@Param('id') id: string) {
    return this.prisma.contentCategory.findUnique({ where: { id }, include: { parent: true, children: true } });
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category' })
  async updateCategory(@Param('id') id: string, @Body() dto: CreateCategoryDto) {
    return this.prisma.contentCategory.update({ where: { id }, data: dto });
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category' })
  async deleteCategory(@Param('id') id: string) {
    return this.prisma.contentCategory.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  @Post('media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager', 'editor')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload media file' })
  async uploadMedia(@UploadedFile() file: Express.Multer.File, @Body() dto: MediaUploadDto, @Req() req: any) {
    return this.mediaService.upload(file, req.user.id, { folder: dto.folder, alt: dto.alt, caption: dto.caption, tags: dto.tags });
  }

  @Get('media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List media files' })
  async listMedia(@Query() query: any) {
    return this.mediaService.findAll(query);
  }

  @Delete('media/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete media file' })
  async deleteMedia(@Param('id') id: string) {
    return this.mediaService.delete(id);
  }

  @Get('media/folders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get media folders' })
  async getMediaFolders() {
    return this.mediaService.getFolders();
  }

  @Post('newsletter/subscribe')
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  async subscribeNewsletter(@Body() dto: NewsletterSubscribeDto) {
    return this.newsletterService.subscribe(dto.email, dto);
  }

  @Post('newsletter/unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from newsletter' })
  async unsubscribeNewsletter(@Body() body: { email: string; reason?: string }) {
    return this.newsletterService.unsubscribe(body.email, body.reason);
  }

  @Post('newsletter/campaigns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create newsletter campaign' })
  async createCampaign(@Body() dto: CreateCampaignDto, @Req() req: any) {
    return this.newsletterService.createCampaign({ ...dto, createdBy: req.user.id });
  }

  @Get('newsletter/campaigns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get newsletter campaigns' })
  async getCampaigns(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.newsletterService.getCampaigns(page, limit);
  }

  @Post('newsletter/campaigns/:id/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send newsletter campaign' })
  async sendCampaign(@Param('id') id: string) {
    return this.newsletterService.sendCampaign(id);
  }

  @Get('newsletter/subscribers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get newsletter subscribers' })
  async getSubscribers(@Query('page') page?: number, @Query('limit') limit?: number, @Query('isActive') isActive?: string) {
    const active = isActive === undefined ? undefined : isActive === 'true';
    return this.newsletterService.getSubscribers(page, limit, active);
  }

  @Post('authors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create author' })
  async createAuthor(@Body() dto: CreateAuthorDto) {
    return this.prisma.author.create({ data: dto });
  }

  @Get('authors')
  @ApiOperation({ summary: 'Get all authors' })
  async getAuthors() {
    return this.prisma.author.findMany({ orderBy: { displayOrder: 'asc' } });
  }

  @Get('authors/:id')
  @ApiOperation({ summary: 'Get author by ID' })
  async getAuthor(@Param('id') id: string) {
    return this.prisma.author.findUnique({ where: { id }, include: { posts: { where: { deletedAt: null, status: 'published' }, orderBy: { publishedAt: 'desc' }, take: 10 } } });
  }

  @Put('authors/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update author' })
  async updateAuthor(@Param('id') id: string, @Body() dto: CreateAuthorDto) {
    return this.prisma.author.update({ where: { id }, data: dto });
  }

  @Delete('authors/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete author' })
  async deleteAuthor(@Param('id') id: string) {
    return this.prisma.author.delete({ where: { id } });
  }

  @Post('posts/:id/bookmark')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle bookmark post' })
  async toggleBookmark(@Param('id') id: string, @Req() req: any) {
    const existing = await this.prisma.contentBookmark.findUnique({
      where: { postId_userId: { postId: id, userId: req.user.id } },
    });
    if (existing) {
      await this.prisma.contentBookmark.delete({ where: { id: existing.id } });
      await this.prisma.blogPost.update({ where: { id }, data: { bookmarkCount: { decrement: 1 } } });
      return { bookmarked: false };
    }
    await this.prisma.contentBookmark.create({ data: { userId: req.user.id, postId: id } });
    await this.prisma.blogPost.update({ where: { id }, data: { bookmarkCount: { increment: 1 } } });
    return { bookmarked: true };
  }

  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle like post' })
  async toggleLike(@Param('id') id: string, @Req() req: any) {
    const existing = await this.prisma.contentLike.findUnique({
      where: { postId_userId: { postId: id, userId: req.user.id } },
    });
    if (existing) {
      await this.prisma.contentLike.delete({ where: { id: existing.id } });
      await this.prisma.blogPost.update({ where: { id }, data: { likeCount: { decrement: 1 } } });
      return { liked: false };
    }
    await this.prisma.contentLike.create({ data: { userId: req.user.id, postId: id } });
    await this.prisma.blogPost.update({ where: { id }, data: { likeCount: { increment: 1 } } });
    return { liked: true };
  }
}

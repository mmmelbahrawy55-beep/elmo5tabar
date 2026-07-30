import { Test, TestingModule } from '@nestjs/testing';
import { CmsController } from './cms.controller';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CmsPostService } from './services/cms-post.service';
import { CmsWorkflowService } from './services/cms-workflow.service';
import { CmsAnalyticsService } from './services/cms-analytics.service';
import { CmsMediaService } from './services/cms-media.service';
import { CmsNewsletterService } from './services/cms-newsletter.service';
import { CmsCommentService } from './services/cms-comment.service';
import { mockPrismaService } from '../../../test/mocks';

describe('CmsController', () => {
  let controller: CmsController;

  const mockPostService = {
    create: jest.fn().mockResolvedValue({ id: 'post-1', titleAr: 'مقال', status: 'DRAFT' }),
    findAll: jest.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } }),
    findOne: jest.fn().mockResolvedValue({ id: 'post-1', titleAr: 'مقال', contentAr: 'محتوى' }),
    update: jest.fn().mockResolvedValue({ id: 'post-1', titleAr: 'محدث' }),
    remove: jest.fn().mockResolvedValue({ message: 'Post deleted' }),
  };

  const mockWorkflowService = {
    submitForReview: jest.fn().mockResolvedValue({ id: 'post-1', status: 'UNDER_REVIEW' }),
    approve: jest.fn().mockResolvedValue({ id: 'post-1', status: 'APPROVED' }),
    reject: jest.fn().mockResolvedValue({ id: 'post-1', status: 'REJECTED' }),
    requestChanges: jest.fn().mockResolvedValue({ id: 'post-1', status: 'CHANGES_REQUESTED' }),
    publish: jest.fn().mockResolvedValue({ id: 'post-1', status: 'PUBLISHED' }),
    archive: jest.fn().mockResolvedValue({ id: 'post-1', status: 'ARCHIVED' }),
    schedule: jest.fn().mockResolvedValue({ id: 'post-1', scheduledAt: new Date() }),
    getWorkflowHistory: jest.fn().mockResolvedValue([{ action: 'SUBMITTED', timestamp: new Date() }]),
    getRevision: jest.fn().mockResolvedValue({ id: 'rev-1', postId: 'post-1', contentAr: 'مراجعة' }),
    getRevisions: jest.fn().mockResolvedValue([{ id: 'rev-1', version: 2 }]),
    restoreRevision: jest.fn().mockResolvedValue({ id: 'post-1', status: 'DRAFT' }),
  };

  const mockAnalyticsService = {
    getDashboard: jest.fn().mockResolvedValue({ totalPosts: 100, totalViews: 50000 }),
    getPostAnalytics: jest.fn().mockResolvedValue({ views: 1500, likes: 200 }),
    recordView: jest.fn().mockResolvedValue({ recorded: true }),
    recordLike: jest.fn().mockResolvedValue({ recorded: true }),
  };

  const mockMediaService = {
    upload: jest.fn().mockResolvedValue({ id: 'media-1', url: 'http://example.com/image.jpg' }),
    findAll: jest.fn().mockResolvedValue({ data: [], meta: {} }),
    findOne: jest.fn().mockResolvedValue({ id: 'media-1', url: 'http://example.com/image.jpg' }),
    delete: jest.fn().mockResolvedValue({ message: 'Media deleted' }),
  };

  const mockNewsletterService = {
    subscribe: jest.fn().mockResolvedValue({ id: 'sub-1', email: 'user@example.com' }),
    unsubscribe: jest.fn().mockResolvedValue({ message: 'Unsubscribed' }),
    getSubscribers: jest.fn().mockResolvedValue({ data: [], meta: {} }),
    createCampaign: jest.fn().mockResolvedValue({ id: 'camp-1', name: 'Campaign' }),
    sendCampaign: jest.fn().mockResolvedValue({ sent: 100, failed: 2 }),
    getCampaignStats: jest.fn().mockResolvedValue({ openRate: 45, clickRate: 20 }),
  };

  const mockCommentService = {
    findAll: jest.fn().mockResolvedValue({ data: [], meta: {} }),
    create: jest.fn().mockResolvedValue({ id: 'comment-1', content: 'Great article!' }),
    moderate: jest.fn().mockResolvedValue({ id: 'comment-1', status: 'APPROVED' }),
    delete: jest.fn().mockResolvedValue({ message: 'Comment deleted' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CmsController],
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CmsPostService, useValue: mockPostService },
        { provide: CmsWorkflowService, useValue: mockWorkflowService },
        { provide: CmsAnalyticsService, useValue: mockAnalyticsService },
        { provide: CmsMediaService, useValue: mockMediaService },
        { provide: CmsNewsletterService, useValue: mockNewsletterService },
        { provide: CmsCommentService, useValue: mockCommentService },
      ],
    }).compile();

    controller = module.get(CmsController);
    jest.clearAllMocks();
  });

  it('should GET /cms/dashboard', async () => {
    const result = await controller.getDashboard({ days: 30 });
    expect(result.totalPosts).toBe(100);
  });

  it('should CRUD posts', async () => {
    let result = await controller.createPost({ titleAr: 'مقال', titleEn: 'Article', contentAr: 'محتوى', contentEn: 'Content', status: 'DRAFT', authorId: 'author-1', categoryId: 'cat-1', tags: ['tech'], publishedAt: undefined, featuredImage: undefined, metaTitle: undefined, metaDescription: undefined, slug: undefined, isFeatured: false, allowComments: true, language: 'ar' }, { user: { id: 'user-1' } });
    expect(result.id).toBe('post-1');
    result = await controller.getPosts({ page: 1, limit: 20, status: 'PUBLISHED', categorySlug: undefined, tag: undefined, search: undefined });
    expect(result.data).toBeDefined();
    result = await controller.getPost('post-1');
    expect(result.id).toBe('post-1');
    result = await controller.updatePost('post-1', { titleAr: 'محدث' });
    expect(result.titleAr).toBe('محدث');
    result = await controller.deletePost('post-1');
    expect(result.message).toBeDefined();
  });

  it('should handle workflow actions', async () => {
    await controller.submitForReview('post-1');
    expect(mockWorkflowService.submitForReview).toHaveBeenCalledWith('post-1', undefined);
    await controller.approvePost('post-1', { approvedBy: 'user-1', notes: 'Looks good' });
    expect(mockWorkflowService.approve).toHaveBeenCalled();
    await controller.rejectPost('post-1', { rejectedBy: 'user-1', reason: 'Needs revision' });
    expect(mockWorkflowService.reject).toHaveBeenCalled();
    await controller.requestChanges('post-1', { requestedBy: 'user-1', changes: 'Fix grammar' });
    expect(mockWorkflowService.requestChanges).toHaveBeenCalled();
    await controller.publishPost('post-1');
    expect(mockWorkflowService.publish).toHaveBeenCalledWith('post-1', undefined);
    await controller.archivePost('post-1');
    expect(mockWorkflowService.archive).toHaveBeenCalledWith('post-1');
  });

  it('should handle revisions', async () => {
    await controller.getRevisions('post-1');
    expect(mockWorkflowService.getRevisions).toHaveBeenCalled();
    await controller.getRevision('post-1', 'rev-1');
    expect(mockWorkflowService.getRevision).toHaveBeenCalled();
    await controller.restoreRevision('post-1', 'rev-1');
    expect(mockWorkflowService.restoreRevision).toHaveBeenCalled();
  });

  it('should handle media upload', async () => {
    const file = { originalname: 'image.jpg', path: '/tmp/image.jpg', mimetype: 'image/jpeg', size: 1024 };
    await controller.uploadMedia(file, { user: { id: 'user-1' } }, 'images', 'article');
    expect(mockMediaService.upload).toHaveBeenCalled();
  });

  it('should handle comments', async () => {
    await controller.getComments({});
    await controller.createComment({ postId: 'post-1', content: 'Great!', authorName: 'User', authorEmail: 'user@test.com' });
    await controller.moderateComment('comment-1', { status: 'APPROVED' });
    await controller.deleteComment('comment-1');
    expect(mockCommentService.findAll).toHaveBeenCalled();
  });

  it('should handle newsletter', async () => {
    await controller.subscribe({ email: 'user@example.com', name: 'User', language: 'ar', tags: [] });
    await controller.unsubscribe('user@example.com');
    await controller.getSubscribers({});
    await controller.createCampaign({ name: 'Summer Promo', subject: 'Special offer', bodyAr: 'خصم', bodyEn: 'Discount', recipientFilter: {} });
    await controller.sendCampaign('camp-1');
    await controller.getCampaignStats('camp-1');
    expect(mockNewsletterService.subscribe).toHaveBeenCalled();
  });

  it('should handle post analytics', async () => {
    await controller.getPostAnalytics('post-1', { days: 7 });
    expect(mockAnalyticsService.getPostAnalytics).toHaveBeenCalled();
  });
});

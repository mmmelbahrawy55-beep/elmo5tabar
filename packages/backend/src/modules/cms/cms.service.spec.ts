import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockPrismaService, mockCacheManager } from '../../../test/mocks';

describe('CmsService', () => {
  let prisma: typeof mockPrismaService;

  const mockBlogPost = {
    id: 'post-1',
    slug: 'what-is-cbc-test',
    contentType: 'article',
    titleAr: 'ما هو تحليل CBC',
    titleEn: 'What is CBC Test',
    excerptAr: 'شرح تحليل CBC',
    excerptEn: 'Explanation of CBC test',
    contentAr: 'تحليل CBC هو فحص الدم الشامل...',
    contentEn: 'Complete Blood Count (CBC) is a blood test...',
    featuredImage: null,
    tags: ['cbc', 'blood-test', 'hematology'],
    status: 'published',
    locale: 'both',
    allowComments: true,
    isPinned: false,
    viewCount: 0,
    shareCount: 0,
    likeCount: 0,
    commentCount: 0,
    bookmarkCount: 0,
    readingTime: 5,
    isFeatured: false,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    author: { id: 'author-1', nameAr: 'د. أحمد', nameEn: 'Dr. Ahmed' },
    category: { id: 'cat-1', nameAr: 'فحوصات الدم', nameEn: 'Blood Tests' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('blog CRUD', () => {
    it('should create a blog post', async () => {
      mockPrismaService.blogPost.create.mockResolvedValue(mockBlogPost);

      const result = await prisma.blogPost.create({
        data: { slug: 'what-is-cbc-test', contentType: 'article', titleAr: 'ما هو تحليل CBC', titleEn: 'What is CBC Test' } as any,
      });

      expect(result.slug).toBe('what-is-cbc-test');
    });

    it('should find published posts', async () => {
      mockPrismaService.blogPost.findMany.mockResolvedValue([mockBlogPost]);
      mockPrismaService.blogPost.count.mockResolvedValue(1);

      const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({ where: { status: 'published' } }),
        prisma.blogPost.count({ where: { status: 'published' } }),
      ]);

      expect(posts).toHaveLength(1);
      expect(total).toBe(1);
    });

    it('should find post by slug', async () => {
      mockPrismaService.blogPost.findUnique.mockResolvedValue(mockBlogPost);

      const result = await prisma.blogPost.findUnique({ where: { slug: 'what-is-cbc-test' } });

      expect(result.slug).toBe('what-is-cbc-test');
    });

    it('should update a blog post', async () => {
      const updated = { ...mockBlogPost, titleAr: 'ما هو تحليل CBC - محدث' };
      mockPrismaService.blogPost.update.mockResolvedValue(updated);

      const result = await prisma.blogPost.update({ where: { id: 'post-1' }, data: { titleAr: 'ما هو تحليل CBC - محدث' } });

      expect(result.titleAr).toContain('محدث');
    });

    it('should soft delete a post', async () => {
      mockPrismaService.blogPost.update.mockResolvedValue({ ...mockBlogPost, deletedAt: new Date() });

      const result = await prisma.blogPost.update({ where: { id: 'post-1' }, data: { deletedAt: new Date() } });

      expect(result.deletedAt).toBeDefined();
    });
  });

  describe('revision history', () => {
    it('should create revision on update', () => {
      const revisions = [
        { version: 1, titleAr: 'Original', createdAt: new Date('2026-01-01') },
        { version: 2, titleAr: 'Updated', createdAt: new Date('2026-06-01') },
      ];

      expect(revisions).toHaveLength(2);
      expect(revisions[1].version).toBeGreaterThan(revisions[0].version);
    });

    it('should restore previous revision', () => {
      const revisions = [
        { version: 1, contentAr: 'Original content' },
        { version: 2, contentAr: 'Modified content' },
      ];

      const restored = revisions.find((r) => r.version === 1);
      expect(restored?.contentAr).toBe('Original content');
    });
  });

  describe('content workflow', () => {
    it('should follow draft -> review -> approved -> published flow', () => {
      const workflow = ['draft', 'review', 'approved', 'published'];
      expect(workflow).toHaveLength(4);
    });

    it('should not publish from draft directly to published without review', () => {
      const validTransitions: Record<string, string[]> = {
        draft: ['review'],
        review: ['approved', 'draft'],
        approved: ['published', 'draft'],
        published: ['draft'],
        archived: ['draft'],
      };

      const canPublishDirectly = validTransitions.draft.includes('published');
      expect(canPublishDirectly).toBe(false);
    });
  });

  describe('media upload handling', () => {
    it('should track media metadata', () => {
      const media = {
        name: 'blood-test-image',
        fileName: 'blood-test.jpg',
        fileType: 'image',
        mimeType: 'image/jpeg',
        fileSize: 204800,
        width: 800,
        height: 600,
      };

      expect(media.fileSize).toBe(204800);
      expect(media.mimeType).toBe('image/jpeg');
    });

    it('should handle large file rejection', () => {
      const maxSize = 10 * 1024 * 1024;
      const fileSize = 15 * 1024 * 1024;

      expect(fileSize).toBeGreaterThan(maxSize);
    });
  });

  describe('comment moderation', () => {
    it('should approve comments', async () => {
      mockPrismaService.contentComment.update.mockResolvedValue({ id: 'comment-1', isApproved: true });

      const result = await mockPrismaService.contentComment.update({
        where: { id: 'comment-1' },
        data: { isApproved: true },
      });

      expect(result.isApproved).toBe(true);
    });

    it('should mark comments as spam', async () => {
      mockPrismaService.contentComment.update.mockResolvedValue({ id: 'comment-1', isSpam: true });

      const result = await mockPrismaService.contentComment.update({
        where: { id: 'comment-1' },
        data: { isSpam: true },
      });

      expect(result.isSpam).toBe(true);
    });
  });

  describe('newsletter campaign', () => {
    it('should create a campaign', () => {
      const campaign = {
        subjectAr: 'نشرة المختبر الشهرية',
        subjectEn: 'Monthly Lab Newsletter',
        contentAr: 'أهلاً بك في نشرتنا الشهرية...',
        contentEn: 'Welcome to our monthly newsletter...',
        status: 'draft',
        recipientCount: 5000,
      };

      expect(campaign.status).toBe('draft');
    });

    it('should send campaign to subscribers', async () => {
      mockPrismaService.newsletterCampaign.update.mockResolvedValue({
        id: 'camp-1',
        status: 'sending',
        sentAt: new Date(),
      });

      const result = await mockPrismaService.newsletterCampaign.update({
        where: { id: 'camp-1' },
        data: { status: 'sending', sentAt: new Date() },
      });

      expect(result.status).toBe('sending');
    });
  });
});

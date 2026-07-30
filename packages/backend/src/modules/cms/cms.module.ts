import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CmsController } from './cms.controller';
import { CmsPostService } from './services/cms-post.service';
import { CmsWorkflowService } from './services/cms-workflow.service';
import { CmsAnalyticsService } from './services/cms-analytics.service';
import { CmsMediaService } from './services/cms-media.service';
import { CmsNewsletterService } from './services/cms-newsletter.service';
import { CmsCommentService } from './services/cms-comment.service';

@Module({
  imports: [
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [CmsController],
  providers: [
    CmsPostService,
    CmsWorkflowService,
    CmsAnalyticsService,
    CmsMediaService,
    CmsNewsletterService,
    CmsCommentService,
  ],
  exports: [],
})
export class CmsModule {}

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../lib/prisma/prisma.service';

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    @InjectQueue('sms-queue') private readonly smsQueue: Queue,
    @InjectQueue('whatsapp-queue') private readonly whatsappQueue: Queue,
    @InjectQueue('push-queue') private readonly pushQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  private getQueue(channel: string): Queue {
    const map: Record<string, Queue> = {
      EMAIL: this.emailQueue,
      SMS: this.smsQueue,
      WHATSAPP: this.whatsappQueue,
      PUSH: this.pushQueue,
    };
    return map[channel] || this.notificationsQueue;
  }

  async enqueue(job: {
    notificationId: string;
    userId: string;
    channel: string;
    type: string;
    priority: string;
    data: Record<string, any>;
    titleAr: string;
    titleEn: string;
    bodyAr: string;
    bodyEn: string;
    retryCount: number;
    maxRetries: number;
  }): Promise<string> {
    try {
      const queue = this.getQueue(job.channel);
      const priorityMap: Record<string, number> = { URGENT: 1, HIGH: 2, NORMAL: 3, LOW: 4 };
      const priority = priorityMap[job.priority] || 3;

      const bullJob = await queue.add('send', job, {
        priority,
        attempts: job.maxRetries + 1,
        backoff: { type: 'exponential', delay: 60000 },
        removeOnComplete: true,
        removeOnFail: false,
      });

      this.logger.log(`Enqueued notification ${job.notificationId} to ${job.channel} queue (job ${bullJob.id})`);
      return bullJob.id!.toString();
    } catch (error) {
      this.logger.error(`Failed to enqueue notification ${job.notificationId}: ${error.message}`);
      throw error;
    }
  }

  async dequeue(notificationId: string): Promise<void> {
    try {
      const queues = [this.notificationsQueue, this.emailQueue, this.smsQueue, this.whatsappQueue, this.pushQueue];
      for (const queue of queues) {
        const jobs = await queue.getJobs(['waiting', 'active', 'delayed']);
        for (const job of jobs) {
          if (job.data?.notificationId === notificationId) {
            await job.remove();
            this.logger.log(`Removed job ${job.id} from ${queue.name} for notification ${notificationId}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to dequeue notification ${notificationId}: ${error.message}`);
    }
  }

  async getQueueStatus(): Promise<{
    notifications: { waiting: number; active: number; failed: number; completed: number };
    email: { waiting: number; active: number; failed: number; completed: number };
    sms: { waiting: number; active: number; failed: number; completed: number };
    whatsapp: { waiting: number; active: number; failed: number; completed: number };
    push: { waiting: number; active: number; failed: number; completed: number };
  }> {
    const [notif, email, sms, whatsapp, push] = await Promise.all([
      this.getCounts(this.notificationsQueue),
      this.getCounts(this.emailQueue),
      this.getCounts(this.smsQueue),
      this.getCounts(this.whatsappQueue),
      this.getCounts(this.pushQueue),
    ]);

    return {
      notifications: notif,
      email,
      sms,
      whatsapp,
      push,
    };
  }

  private async getCounts(queue: Queue): Promise<{ waiting: number; active: number; failed: number; completed: number }> {
    const [waiting, active, failed, completed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getFailedCount(),
      queue.getCompletedCount(),
    ]);
    return { waiting, active, failed, completed };
  }

  async getPendingCounts(): Promise<{ byChannel: Record<string, number>; byType: Record<string, number> }> {
    try {
      const jobs = await this.notificationsQueue.getJobs(['waiting', 'delayed']);
      const byChannel: Record<string, number> = {};
      const byType: Record<string, number> = {};

      for (const job of jobs) {
        const ch = job.data?.channel || 'UNKNOWN';
        const tp = job.data?.type || 'UNKNOWN';
        byChannel[ch] = (byChannel[ch] || 0) + 1;
        byType[tp] = (byType[tp] || 0) + 1;
      }

      return { byChannel, byType };
    } catch (error) {
      this.logger.error(`Failed to get pending counts: ${error.message}`);
      return { byChannel: {}, byType: {} };
    }
  }

  async getQueueMetrics(): Promise<{
    throughput: { perMinute: number; perHour: number; perDay: number };
    avgProcessingTime: number;
  }> {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60000);
      const oneHourAgo = new Date(Date.now() - 3600000);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const completedJobs = await this.notificationsQueue.getCompleted();
      const recentCompleted = completedJobs.filter((j) => j.finishedOn && j.finishedOn > oneMinuteAgo.getTime());
      const hourCompleted = completedJobs.filter((j) => j.finishedOn && j.finishedOn > oneHourAgo.getTime());
      const dayCompleted = completedJobs.filter((j) => j.finishedOn && j.finishedOn > todayStart.getTime());

      const processingTimes = completedJobs
        .filter((j) => j.processedOn && j.finishedOn)
        .map((j) => j.finishedOn! - j.processedOn!);

      const avgTime = processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 0;

      return {
        throughput: {
          perMinute: recentCompleted.length,
          perHour: hourCompleted.length,
          perDay: dayCompleted.length,
        },
        avgProcessingTime: Math.round(avgTime),
      };
    } catch (error) {
      this.logger.error(`Failed to get queue metrics: ${error.message}`);
      return { throughput: { perMinute: 0, perHour: 0, perDay: 0 }, avgProcessingTime: 0 };
    }
  }

  async pauseQueue(channel?: string): Promise<void> {
    try {
      if (channel) {
        const queue = this.getQueue(channel);
        await queue.pause();
        this.logger.log(`Paused ${channel} queue`);
      } else {
        await Promise.all([
          this.notificationsQueue.pause(),
          this.emailQueue.pause(),
          this.smsQueue.pause(),
          this.whatsappQueue.pause(),
          this.pushQueue.pause(),
        ]);
        this.logger.log('Paused all queues');
      }
    } catch (error) {
      this.logger.error(`Failed to pause queue: ${error.message}`);
    }
  }

  async resumeQueue(channel?: string): Promise<void> {
    try {
      if (channel) {
        const queue = this.getQueue(channel);
        await queue.resume();
        this.logger.log(`Resumed ${channel} queue`);
      } else {
        await Promise.all([
          this.notificationsQueue.resume(),
          this.emailQueue.resume(),
          this.smsQueue.resume(),
          this.whatsappQueue.resume(),
          this.pushQueue.resume(),
        ]);
        this.logger.log('Resumed all queues');
      }
    } catch (error) {
      this.logger.error(`Failed to resume queue: ${error.message}`);
    }
  }
}


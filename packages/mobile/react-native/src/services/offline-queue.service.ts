import { InternalAxiosRequestConfig } from 'axios';
import { storage } from './storage.service';
import NetInfo from '@react-native-community/netinfo';

interface QueuedRequest {
  config: InternalAxiosRequestConfig;
  timestamp: number;
  retryCount: number;
  priority?: number;
}

const MAX_RETRIES = 3;
const QUEUE_KEY = 'offline_request_queue';

class OfflineQueueService {
  private queue: QueuedRequest[] = [];
  private processing = false;

  constructor() {
    this.loadQueue();
    NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        this.processQueue();
      }
    });
  }

  private loadQueue(): void {
    const saved = storage.getString(QUEUE_KEY);
    if (saved) {
      try {
        this.queue = JSON.parse(saved);
      } catch {
        this.queue = [];
      }
    }
  }

  private saveQueue(): void {
    storage.set(QUEUE_KEY, JSON.stringify(this.queue));
  }

  enqueue(request: Omit<QueuedRequest, 'priority'> & { priority?: number }): void {
    const priority = request.priority ?? this.getPriority(request.config);
    this.queue.push({ ...request, priority });
    this.queue.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    this.saveQueue();
  }

  private getPriority(config: InternalAxiosRequestConfig): number {
    const url = config.url ?? '';
    if (url.includes('/auth/')) return 100;
    if (url.includes('/appointments')) return 80;
    if (url.includes('/results')) return 70;
    if (url.includes('/payments')) return 60;
    if (url.includes('/profile')) return 50;
    return 10;
  }

  async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      this.processing = false;
      return;
    }

    const { default: api } = await import('./api');
    const failedItems: QueuedRequest[] = [];

    for (const item of this.queue) {
      if (item.retryCount >= MAX_RETRIES) continue;

      try {
        await api(item.config);
      } catch {
        failedItems.push({
          ...item,
          retryCount: item.retryCount + 1,
        });
      }
    }

    this.queue = failedItems;
    this.saveQueue();
    this.processing = false;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
  }
}

export const offlineQueueService = new OfflineQueueService();

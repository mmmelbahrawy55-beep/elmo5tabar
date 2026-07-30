import { useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useAppStore } from '../state/app.store';
import { offlineQueueService } from '../services/offline-queue.service';

export const useOffline = () => {
  const { isOnline, setOnline, setLastSync, pendingActions, addPendingAction, removePendingAction } = useAppStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? false;
      setOnline(connected);

      if (connected) {
        offlineQueueService.processQueue();
        setLastSync(new Date().toISOString());
      }
    });

    return () => {
      unsubscribe();
    };
  }, [setOnline, setLastSync]);

  const syncNow = useCallback(async () => {
    if (isOnline) {
      await offlineQueueService.processQueue();
      setLastSync(new Date().toISOString());
    }
  }, [isOnline, setLastSync]);

  return {
    isOnline,
    pendingActions,
    queueLength: offlineQueueService.getQueueLength(),
    syncNow,
    addPendingAction,
    removePendingAction,
  };
};

'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/api/auth';

interface Device {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  lastSeen: string;
  trusted: boolean;
  isCurrent: boolean;
}

interface LoginHistory {
  id: string;
  timestamp: string;
  ip: string;
  location: string;
  device: string;
  success: boolean;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}

export default function DeviceManager() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [securityScore, setSecurityScore] = useState(0);

  useEffect(() => {
    fetchDevices();
  }, []);

  const addToast = (message: string, type: Toast['type'] = 'error') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const result = await authClient.getDevices();
      setDevices(result.devices || []);
      setSecurityScore(result.securityScore || 0);
    } catch (err: any) {
      addToast(err.message || 'Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginHistory = async (deviceId: string) => {
    setLoadingHistory(true);
    try {
      const result = await authClient.request(`/auth/devices/${deviceId}/history`);
      setLoginHistory(result.history || []);
    } catch (err: any) {
      addToast(err.message || 'Failed to fetch login history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTrustToggle = async (device: Device) => {
    try {
      if (device.trusted) {
        await authClient.request(`/auth/devices/${device.id}/trust`, {
          method: 'PATCH',
          body: JSON.stringify({ trusted: false }),
        });
        addToast('تم إلغاء ثقة الجهاز', 'success');
      } else {
        await authClient.trustDevice(device.id);
        addToast('تم الثقة بالجهاز', 'success');
      }
      fetchDevices();
    } catch (err: any) {
      addToast(err.message || 'Failed to update device');
    }
  };

  const handleRemoveDevice = async (device: Device) => {
    if (!confirm('هل أنت متأكد من حذف هذا الجهاز؟')) return;
    try {
      await authClient.removeDevice(device.id);
      addToast('تم حذف الجهاز', 'success');
      fetchDevices();
      if (selectedDevice?.id === device.id) {
        setSelectedDevice(null);
        setLoginHistory([]);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to remove device');
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'mobile':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'tablet':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">الأجهزة المسجلة</h2>
        <button
          onClick={fetchDevices}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">مؤشر الأمان</p>
            <p className="text-3xl font-bold">{securityScore}/100</p>
          </div>
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeDasharray={`${(securityScore / 100) * 283} 283`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {devices.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            لا توجد أجهزة مسجلة
          </div>
        ) : (
          devices.map((device) => (
            <div
              key={device.id}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                selectedDevice?.id === device.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => {
                setSelectedDevice(device);
                fetchLoginHistory(device.id);
              }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  device.trusted
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {getDeviceIcon(device.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{device.name}</p>
                    {device.isCurrent && (
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                        الجهاز الحالي
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {device.os} • {device.browser}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    آخر ظهور: {formatDate(device.lastSeen)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTrustToggle(device);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      device.trusted
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title={device.trusted ? 'إلغاء الثقة' : 'الثقة بالجهاز'}
                  >
                    {device.trusted ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </button>
                  {!device.isCurrent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveDevice(device);
                      }}
                      className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      title="حذف الجهاز"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedDevice && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            سجل تسجيل الدخول - {selectedDevice.name}
          </h3>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : loginHistory.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              لا يوجد سجل تسجيل دخول
            </div>
          ) : (
            <div className="space-y-2">
              {loginHistory.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-lg ${
                    entry.success
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {entry.success ? (
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className="text-sm text-gray-900 dark:text-white">
                        {entry.success ? 'نجاح' : 'فشل'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    <span>IP: {entry.ip}</span>
                    <span className="mx-2">•</span>
                    <span>{entry.location}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg max-w-sm ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : toast.type === 'warning'
                ? 'bg-yellow-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="mr-2 hover:opacity-75">
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

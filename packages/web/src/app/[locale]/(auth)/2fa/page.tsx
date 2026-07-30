'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/api/auth';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}

export default function TwoFactorPage() {
  const t = useTranslations('auth.twoFactor');
  const router = useRouter();

  const [method, setMethod] = useState<'sms' | 'email' | 'totp'>('totp');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [backupCode, setBackupCode] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const addToast = (message: string, type: Toast['type'] = 'error') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSetup = async () => {
    setLoading(true);
    try {
      const result = await authClient.enable2FA(method);
      if (method === 'totp') {
        setQrCode(result.qrCode);
        setSecret(result.secret);
      }
      setStep('verify');
    } catch (err: any) {
      addToast(err.message || t('setupFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (useBackupCode) {
      if (!backupCode) {
        addToast(t('backupCodeRequired'));
        return;
      }
      setLoading(true);
      try {
        await authClient.verify2FA(backupCode);
        addToast(t('twoFactorEnabled'), 'success');
        router.push('/dashboard');
      } catch (err: any) {
        addToast(err.message || t('verifyFailed'));
      } finally {
        setLoading(false);
      }
    } else {
      const code = otp.join('');
      if (code.length !== 6) {
        addToast(t('otpRequired'));
        return;
      }
      setLoading(true);
      try {
        const result = await authClient.verify2FA(code);
        if (result.backupCodes) {
          setBackupCodes(result.backupCodes);
          setShowBackupCodes(true);
        } else {
          addToast(t('twoFactorEnabled'), 'success');
          router.push('/dashboard');
        }
      } catch (err: any) {
        addToast(err.message || t('verifyFailed'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    addToast(t('backupCodesCopied'), 'success');
  };

  const handleDownloadBackupCodes = () => {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mokhtabar-2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (showBackupCodes) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4" dir="rtl">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('backupCodesTitle')}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">{t('backupCodesDescription')}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div key={index} className="font-mono text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-600 px-3 py-2 rounded">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <button
                onClick={handleCopyBackupCodes}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t('copyCodes')}
              </button>
              <button
                onClick={handleDownloadBackupCodes}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('downloadCodes')}
              </button>
            </div>

            <button
              onClick={() => {
                addToast(t('twoFactorEnabled'), 'success');
                router.push('/dashboard');
              }}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              {t('continueToDashboard')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{t('subtitle')}</p>
          </div>

          {step === 'setup' ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <button
                  onClick={() => setMethod('sms')}
                  className={`w-full p-4 rounded-lg border-2 text-right transition-colors ${
                    method === 'sms'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      method === 'sms' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">{t('smsMethod')}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('smsDescription')}</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setMethod('email')}
                  className={`w-full p-4 rounded-lg border-2 text-right transition-colors ${
                    method === 'email'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      method === 'email' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">{t('emailMethod')}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('emailDescription')}</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setMethod('totp')}
                  className={`w-full p-4 rounded-lg border-2 text-right transition-colors ${
                    method === 'totp'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      method === 'totp' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">{t('totpMethod')}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('totpDescription')}</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="trustDevice"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="trustDevice" className="text-sm text-gray-700 dark:text-gray-300">
                  {t('trustThisDevice')}
                </label>
              </div>

              <button
                onClick={handleSetup}
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('settingUp') : t('setupButton')}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {method === 'totp' && qrCode && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('scanQrCode')}</p>
                  <div className="inline-block p-4 bg-white rounded-lg mb-4">
                    <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('manualEntry')}</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white break-all" dir="ltr">{secret}</p>
                  </div>
                </div>
              )}

              {method !== 'totp' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('codeSentTo')} {method === 'sms' ? t('yourPhone') : t('yourEmail')}
                  </p>
                </div>
              )}

              <div>
                <div className="flex justify-center gap-2 mb-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      onPaste={handleOTPPaste}
                      className="w-12 h-14 text-center text-2xl font-bold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      dir="ltr"
                    />
                  ))}
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setUseBackupCode(!useBackupCode)}
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  {useBackupCode ? t('useOTP') : t('useBackupCode')}
                </button>
              </div>

              {useBackupCode && (
                <div>
                  <input
                    type="text"
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono"
                    placeholder={t('backupCodePlaceholder')}
                    dir="ltr"
                  />
                </div>
              )}

              <button
                onClick={handleVerify}
                disabled={loading || (!useBackupCode && otp.join('').length !== 6) || (useBackupCode && !backupCode)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('verifying') : t('verifyButton')}
              </button>

              <button
                onClick={() => setStep('setup')}
                className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {t('backToSetup')}
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <a
              href="/recovery"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-center block"
            >
              {t('recoveryOptions')}
            </a>
          </div>
        </div>
      </div>

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

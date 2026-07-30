'use client';

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

interface Requirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  {
    id: 'length',
    label: 'على الأقل 8 أحرف',
    test: (password) => password.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'حرف كبير واحد على الأقل (A-Z)',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'حرف صغير واحد على الأقل (a-z)',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: 'رقم واحد على الأقل (0-9)',
    test: (password) => /[0-9]/.test(password),
  },
  {
    id: 'special',
    label: 'رمز خاص واحد على الأقل (!@#$%^&*)',
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

export default function PasswordStrength({
  password,
  showRequirements = true,
  className = '',
}: PasswordStrengthProps) {
  const getStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = getStrength(password);
  const percentage = (strength / 5) * 100;

  const getStrengthLabel = (strength: number) => {
    switch (strength) {
      case 0:
        return '';
      case 1:
        return 'ضعيف جداً';
      case 2:
        return 'ضعيف';
      case 3:
        return 'متوسط';
      case 4:
        return 'قوي';
      case 5:
        return 'قوي جداً';
      default:
        return '';
    }
  };

  const getStrengthColor = (strength: number) => {
    switch (strength) {
      case 0:
        return 'bg-gray-200 dark:bg-gray-700';
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-lime-500';
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-200 dark:bg-gray-700';
    }
  };

  const getTextColor = (strength: number) => {
    switch (strength) {
      case 0:
        return 'text-gray-500 dark:text-gray-400';
      case 1:
        return 'text-red-600 dark:text-red-400';
      case 2:
        return 'text-orange-600 dark:text-orange-400';
      case 3:
        return 'text-yellow-600 dark:text-yellow-400';
      case 4:
        return 'text-lime-600 dark:text-lime-400';
      case 5:
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  if (!password) return null;

  return (
    <div className={`space-y-3 ${className}`} dir="rtl">
      <div className="space-y-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                i <= strength ? getStrengthColor(strength) : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        <p className={`text-sm font-medium ${getTextColor(strength)}`}>
          {getStrengthLabel(strength)}
        </p>
      </div>

      {showRequirements && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            متطلبات كلمة المرور:
          </p>
          <ul className="space-y-1">
            {requirements.map((req) => {
              const met = req.test(password);
              return (
                <li
                  key={req.id}
                  className={`flex items-center gap-2 text-sm ${
                    met
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {met ? (
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                  <span>{req.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

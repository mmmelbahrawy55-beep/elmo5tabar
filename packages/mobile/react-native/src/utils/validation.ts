export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const isValidSaudiPhone = (phone: string): boolean => {
  const re = /^(?:\+966|0)?5\d{8}$/;
  return re.test(phone.replace(/\s/g, ''));
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

export const getPasswordStrength = (
  password: string,
): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score, label: 'Weak', color: '#DC3545' };
  if (score <= 3) return { score, label: 'Fair', color: '#FFC107' };
  if (score <= 4) return { score, label: 'Good', color: '#17A2B8' };
  return { score, label: 'Strong', color: '#28A745' };
};

export const isValidName = (name: string): boolean => {
  return name.trim().length >= 2;
};

export const isValidNationalId = (id: string): boolean => {
  const re = /^[12]\d{9}$/;
  return re.test(id);
};

export const isValidDate = (date: string): boolean => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

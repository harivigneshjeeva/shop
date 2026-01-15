export function validateAmount(amount: number | string): { valid: boolean; error?: string } {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }
  
  if (num <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  
  return { valid: true };
}

export function validateDate(date: string | Date, allowFuture: boolean = false): { valid: boolean; error?: string } {
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Invalid date' };
  }
  
  if (!allowFuture && dateObj > today) {
    return { valid: false, error: 'Date cannot be in the future' };
  }
  
  return { valid: true };
}

export function validateRequired(value: unknown, fieldName: string): { valid: boolean; error?: string } {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true };
}

export function validateAmountRange(amount: number | string, min: number = 0, max: number = 1000000): { valid: boolean; error?: string } {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }
  
  if (num <= min) {
    return { valid: false, error: `Amount must be greater than ${min}` };
  }
  
  if (num > max) {
    return { valid: false, error: `Amount cannot exceed ${formatCurrency(max)}` };
  }
  
  return { valid: true };
}

export function detectAnomaly(current: number, historical: number[], threshold: number = 2): { isAnomaly: boolean; message?: string } {
  if (historical.length < 3) return { isAnomaly: false };
  
  const avg = historical.reduce((sum, val) => sum + val, 0) / historical.length;
  const stdDev = Math.sqrt(historical.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / historical.length);
  
  const zScore = Math.abs((current - avg) / stdDev);
  
  if (zScore > threshold) {
    const direction = current > avg ? 'higher' : 'lower';
    return {
      isAnomaly: true,
      message: `This amount is unusually ${direction} than normal (${Math.round(zScore * 100)}% deviation)`
    };
  }
  
  return { isAnomaly: false };
}

export function validateExpenseLimit(amount: number, category: string, monthlyLimit: Record<string, number>): { valid: boolean; warning?: string } {
  const limit = monthlyLimit[category];
  
  if (!limit) return { valid: true };
  
  if (amount > limit) {
    return {
      valid: false,
      warning: `This expense exceeds the monthly limit of ${formatCurrency(limit)} for ${category}`
    };
  }
  
  if (amount > limit * 0.8) {
    return {
      valid: true,
      warning: `Warning: This expense is close to the monthly limit (${Math.round((amount / limit) * 100)}%)`
    };
  }
  
  return { valid: true };
}

function formatCurrency(amount: number): string {
  return `£${amount.toLocaleString()}`;
}

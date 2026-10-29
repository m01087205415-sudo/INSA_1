/**
 * Date and Legal Time utilities (Asia/Seoul - KST)
 */

export function getKSTNow(): { kstString: string; isoString: string; dateOnly: string } {
  const now = new Date();
  const kstOffset = 9 * 60; // KST is UTC+9
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const kstDate = new Date(utc + kstOffset * 60000);

  const year = kstDate.getFullYear();
  const month = String(kstDate.getMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getDate()).padStart(2, '0');
  const hours = String(kstDate.getHours()).padStart(2, '0');
  const minutes = String(kstDate.getMinutes()).padStart(2, '0');
  const seconds = String(kstDate.getSeconds()).padStart(2, '0');

  return {
    kstString: `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (KST)`,
    isoString: kstDate.toISOString(),
    dateOnly: `${year}. ${month}. ${day}.`
  };
}

export function formatKST(dateInput?: string | Date): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(d) + ' (KST)';
}

export function formatKSTDate(dateInput?: string | Date): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d).replace(/\s/g, ' ');
}

/**
 * Calculate statutory deadline: 10 days from receipt date
 * Notice receipt day is generally day 0 (초일불산입 원칙), expires on day 10.
 */
export function calculateStatutoryDeadline(receiptDateStr: string): string {
  try {
    const d = new Date(receiptDateStr);
    d.setDate(d.getDate() + 10);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return '수령일로부터 10일 이내';
  }
}

/**
 * Construction site working days calculator:
 * Sites often work 6 days a week or alternate Saturdays.
 * Excludes Sundays and designated statutory holidays.
 */
export function calculateEffectiveLeaveDays(
  startDateStr: string,
  endDateStr: string,
  slot: 'ALL' | 'AM' | 'PM',
  isSite: boolean = false
): number {
  if (slot === 'AM' || slot === 'PM') {
    return 0.5;
  }

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (start > end) return 0;

  let totalDays = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 is Sunday, 6 is Saturday
    // Sundays are weekly rest days (주휴일)
    if (dayOfWeek !== 0) {
      if (!isSite && dayOfWeek === 6) {
        // Office employees: Saturday is non-working day
      } else {
        // Construction site or weekday
        totalDays += 1;
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return Math.max(0.5, totalDays);
}

import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

// Format message timestamp
export const formatMessageTime = (date: Date): string => {
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return 'Ayer';
  }
  return format(date, 'dd/MM/yyyy HH:mm');
};

// Format date header in chat
export const formatDateHeader = (date: Date): string => {
  if (isToday(date)) {
    return 'Hoy';
  }
  if (isYesterday(date)) {
    return 'Ayer';
  }
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
};

// Format last seen timestamp
export const formatLastSeen = (date: Date | null): string => {
  if (!date) return 'Desconocido';

  const now = new Date();
  const diffMinutes = differenceInMinutes(now, date);

  if (diffMinutes < 1) {
    return 'Ahora mismo';
  }
  if (diffMinutes < 60) {
    return `Hace ${diffMinutes} min`;
  }
  if (isToday(date)) {
    return format(date, 'HH:mm', { locale: es });
  }
  return format(date, 'dd/MM/yyyy', { locale: es });
};

// Format chat list timestamp
export const formatChatTime = (date: Date): string => {
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return 'Ayer';
  }
  if (date.getFullYear() === new Date().getFullYear()) {
    return format(date, 'dd MMM', { locale: es });
  }
  return format(date, 'dd/MM/yyyy', { locale: es });
};

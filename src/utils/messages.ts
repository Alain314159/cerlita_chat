import type { Message, MessageType } from '@/types';

// Get display text for a message (for chat list preview)
export const getMessagePreview = (message: Message): string => {
  if (message.status === 'sending') {
    return 'Enviando...';
  }
  if (message.status === 'failed') {
    return 'Error al enviar';
  }

  switch (message.type) {
    case 'image':
      return '📷 Imagen';
    case 'video':
      return '🎥 Video';
    case 'audio':
      return '🎤 Audio';
    case 'file':
      return '📎 Archivo';
    case 'text':
    default:
      return message.text || '(Sin texto)';
  }
};

// Get icon for message type
export const getMessageTypeIcon = (type: MessageType): string => {
  switch (type) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'audio':
      return 'audio-wave';
    case 'file':
      return 'attachment';
    case 'text':
    default:
      return 'send';
  }
};

// Check if message is media
export const isMediaMessage = (message: Message): boolean => {
  return message.type !== 'text' && message.mediaURL !== null;
};

// Get message status icon
export const getStatusIcon = (status: Message['status']): string => {
  switch (status) {
    case 'sending':
      return 'clock';
    case 'sent':
      return 'check';
    case 'delivered':
      return 'done-all';
    case 'read':
      return 'done-all';
    case 'failed':
      return 'error';
    default:
      return 'schedule';
  }
};

// Get message status color
export const getStatusColor = (status: Message['status']): string => {
  switch (status) {
    case 'sending':
      return '#999';
    case 'sent':
      return '#999';
    case 'delivered':
      return '#4CAF50';
    case 'read':
      return '#2196F3';
    case 'failed':
      return '#F44336';
    default:
      return '#999';
  }
};

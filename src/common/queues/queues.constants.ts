export const QUEUES = {
  MEDIA: 'media',
  BILLING: 'billing',
  NOTIFICATIONS: 'notifications',
} as const;

export const JOBS = {
  IMAGE_METADATA: 'image-metadata',
  TRIAL_EXPIRY: 'trial-expiry',
  PERIOD_END: 'period-end',
  OVERDUE_INVOICE: 'overdue-invoice',
  SEND_EMAIL: 'send-email',
} as const;

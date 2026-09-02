import { z } from 'zod';
import { siteConfig } from '@/lib/config';
import { stripHtml } from '@/lib/validation/sanitize';

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), 'رابط LinkedIn غير صالح');

export const submissionInputSchema = z
  .object({
    categoryId: z.string().uuid().optional(),
    title: z
      .string()
      .trim()
      .max(siteConfig.limits.maxTitleLength)
      .optional()
      .transform((value) => (value ? stripHtml(value) : undefined)),
    message: z
      .string()
      .trim()
      .min(siteConfig.limits.minMessageLength, 'الرسالة قصيرة جدًا')
      .max(siteConfig.limits.maxMessageLength, 'الرسالة أطول من المسموح'),
    identityMode: z.enum(['anonymous', 'identified']).optional(),
    senderDisplayName: z.string().trim().max(siteConfig.limits.maxDisplayNameLength).optional(),
    senderEmail: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined)
      .refine((value) => !value || z.email().safeParse(value).success, 'الإيميل غير صالح'),
    senderLinkedin: optionalUrl,
    allowPublicName: z.boolean().optional(),
    allowPublication: z.boolean().optional(),
    acceptGuidelines: z.boolean().optional(),
    website: z.string().max(0).optional(),
    captchaToken: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const message = stripHtml(data.message);
    if (message.length < siteConfig.limits.minMessageLength) {
      ctx.addIssue({
        code: 'custom',
        path: ['message'],
        message: 'الرسالة قصيرة جدًا بعد إزالة التنسيق',
      });
    }

    const name = data.senderDisplayName?.trim() ?? '';
    if (data.identityMode === 'identified' && name.length < 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['senderDisplayName'],
        message: 'الاسم مطلوب',
      });
    }

    if (data.website) {
      ctx.addIssue({
        code: 'custom',
        path: ['website'],
        message: 'تم رفض الرسالة',
      });
    }
  })
  .transform((data) => {
    const name = data.senderDisplayName ? stripHtml(data.senderDisplayName).trim() : '';
    const identified = name.length >= 2;

    return {
      ...data,
      message: stripHtml(data.message),
      title: data.title ? stripHtml(data.title) : undefined,
      identityMode: identified ? ('identified' as const) : ('anonymous' as const),
      senderDisplayName: identified ? name : undefined,
      allowPublicName: identified,
      allowPublication: data.allowPublication !== false,
      senderEmail: identified ? data.senderEmail : undefined,
      senderLinkedin: identified ? data.senderLinkedin : undefined,
    };
  });

export type SubmissionInput = z.infer<typeof submissionInputSchema>;

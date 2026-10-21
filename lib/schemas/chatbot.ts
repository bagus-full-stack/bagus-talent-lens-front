import { z } from 'zod';

export const BoundingBoxReferenceSchema = z.object({
  id: z.string(),
  page: z.number().int().positive(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(0).max(100),
  height: z.number().min(0).max(100),
  label: z.string(),
});

export type BoundingBoxReference = z.infer<typeof BoundingBoxReferenceSchema>;

export const CitationSourceSchema = z.object({
  index: z.number().int().positive(),
  chunkId: z.string(),
  candidateId: z.string(),
  candidatePseudonym: z.string(),
  folderId: z.string(),
  folderReference: z.string(),
  jobTitle: z.string(),
  page: z.number().int().positive(),
  bbox: BoundingBoxReferenceSchema,
  snippet: string(),
  relevanceScore: z.number().min(0).max(100).optional(),
  verified: z.boolean().default(true),
});

function string() {
  return z.string();
}

export type CitationSource = z.infer<typeof CitationSourceSchema>;

export const ProtectedCriterionRefusalSchema = z.object({
  code: z.literal('PROTECTED_CRITERION'),
  category: z.string(),
  categoryLabel: z.string(),
  detectedSnippet: z.string(),
  legalNotice: z.string(),
  message: z.string(),
  suggestion: z.string(),
});

export type ProtectedCriterionRefusal = z.infer<typeof ProtectedCriterionRefusalSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  createdAt: z.string(),
  status: z.enum(['streaming', 'complete', 'interrupted', 'error']).default('complete'),
  type: z.enum(['text', 'refusal', 'empty_sources']).default('text'),
  refusalDetails: ProtectedCriterionRefusalSchema.optional(),
  citations: z.array(CitationSourceSchema).optional(),
  feedback: z.enum(['helpful', 'unhelpful']).nullable().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ConversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  selectedFolderIds: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  messages: z.array(ChatMessageSchema).default([]),
});

export type Conversation = z.infer<typeof ConversationSchema>;

export const CreateConversationSchema = z.object({
  title: z.string().optional(),
  selectedFolderIds: z.array(z.string()).optional(),
  initialMessage: z.string().optional(),
});

export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;

import { z } from 'zod';

export const PipelineStageSchema = z.enum([
  'nouveau',
  'qualifie',
  'entretien_rh',
  'entretien_tech',
  'offre',
  'ecarte',
]);

export type PipelineStage = z.infer<typeof PipelineStageSchema>;

export const CartographyPointSchema = z.object({
  id: z.string(),
  pseudonym: z.string(), // e.g. "Candidat #A1B2"
  currentTitle: z.string(),
  topSkills: z.array(z.string()).max(3),
  allSkills: z.array(z.string()).optional(),
  folderId: z.string(),
  folderReference: z.string(),
  yearsExperience: z.number().min(0),
  pipelineStage: PipelineStageSchema,
  clusterId: z.string(),
  clusterName: z.string(),
  x: z.number(), // 2D X coordinate
  y: z.number(), // 2D Y coordinate
  z: z.number(), // 3D Z coordinate
});

export type CartographyPoint = z.infer<typeof CartographyPointSchema>;

export const CartographyClusterSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(), // Hex or hsl
  count: z.number().int().nonnegative(),
});

export type CartographyCluster = z.infer<typeof CartographyClusterSchema>;

export const ColorBySchema = z.enum(['cluster', 'pipeline', 'experience', 'folder']);
export type ColorByOption = z.infer<typeof ColorBySchema>;

export const CartographyFiltersSchema = z.object({
  folderId: z.string().default('all'),
  selectedSkills: z.array(z.string()).default([]),
  minExperience: z.number().min(0).default(0),
  maxExperience: z.number().min(0).default(20),
  searchSkill: z.string().default(''),
  selectedClusterId: z.string().nullable().default(null),
  colorBy: ColorBySchema.default('cluster'),
  opacity: z.number().min(0.1).max(1.0).default(0.85),
  viewMode: z.enum(['2d', '3d']).default('2d'),
  viewFormat: z.enum(['graph', 'table']).default('graph'),
});

export type CartographyFilters = z.infer<typeof CartographyFiltersSchema>;

export const CartographyDataResponseSchema = z.object({
  points: z.array(CartographyPointSchema),
  clusters: z.array(CartographyClusterSchema),
  totalCount: z.number(),
  lastCalculatedAt: z.string(),
  isRecalculating: z.boolean().default(false),
  blindMode: z.boolean().default(true),
});

export type CartographyDataResponse = z.infer<typeof CartographyDataResponseSchema>;

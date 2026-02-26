export interface GupshupTemplate {
  id: string
  elementName: string
  languageCode: string
  category: string
  status: "APPROVED" | "PENDING" | "REJECTED"
  templateType: string
  data: string
  meta: string // JSON string contendo { example, mediaId, etc }
  containerMeta: string // JSON string contendo { enableSample, allowTemplateCategoryChange, buttons, header, footer, mediaId, etc }
  vertical?: string
  externalId?: string
  namespace?: string
  wabaId?: string
  oldCategory?: string
  mediaUrl?: string // URL da mídia (para IMAGE, VIDEO, DOCUMENT)
  // Outros campos que podem existir mas não são enviados
  appId?: string
  createdOn?: number
  modifiedOn?: number
  internalCategory?: number
  internalType?: number
  languagePolicy?: string
  parameterFormat?: string
  priority?: number
  quality?: string
  retry?: number
  stage?: string
  state?: string
}

export interface MigrationResult {
  templateId: string
  templateName: string
  success: boolean
  error?: string
}

export interface PartnerApp {
  id: string
  name: string
  phone?: string
  customerId?: string
  live?: boolean
  partnerId?: number
  createdOn?: number
  modifiedOn?: number
  partnerCreated?: boolean
  cxpEnabled?: boolean
  partnerUsage?: boolean
  stopped?: boolean
  healthy?: boolean
  cap?: number
}

export type MigrationStatus = "idle" | "running" | "completed"

export type Step = 1 | 2 | 3

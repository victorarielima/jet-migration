"use client"

import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import type { GupshupTemplate } from "@/lib/types"
import { FileText, Image, Video, File, Check, CheckCheck, ChevronDown, Info, ExternalLink, Phone, Copy, Reply, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react"

interface TemplateCardProps {
  template: GupshupTemplate
  selected: boolean
  onToggle: () => void
  sourceAppId?: string
  token?: string
}

// Type for carousel card
interface CarouselCardData {
  cardIndex?: number
  mediaUrl?: string
  imageUrl?: string
  components?: Array<{
    type: string
    format?: string
    text?: string
    example?: {
      header_handle?: string[]
      body_text?: string[][]
    }
    buttons?: Array<{
      type: string
      text?: string
      url?: string
      phone_number?: string
    }>
  }>
}

function TemplateTypeIcon({ type }: { type: string }) {
  switch (type?.toUpperCase()) {
    case "IMAGE":
      return <Image className="h-5 w-5" />
    case "VIDEO":
      return <Video className="h-5 w-5" />
    case "DOCUMENT":
      return <File className="h-5 w-5" />
    default:
      return <FileText className="h-5 w-5" />
  }
}

function statusColor(status: string) {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return "bg-[#25d366]/20 text-[#25d366] border-[#25d366]/40"
    case "PENDING":
      return "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40"
    case "REJECTED":
      return "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40"
    default:
      return "bg-secondary text-muted-foreground border-border"
  }
}

function statusLabel(status: string) {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return "Aprovado"
    case "PENDING":
      return "Não avaliado"
    case "REJECTED":
      return "Rejeitado"
    default:
      return status
  }
}

// Parse buttons from containerMeta OR from data content
function parseButtons(containerMeta: string, data?: string): Array<{ type: string; text: string; url?: string; phone?: string }> {
  const buttons: Array<{ type: string; text: string; url?: string; phone?: string }> = []
  
  // Try containerMeta first
  try {
    const meta = JSON.parse(containerMeta)
    if (meta.buttons && Array.isArray(meta.buttons)) {
      buttons.push(...meta.buttons.map((btn: any) => ({
        type: btn.type || "QUICK_REPLY",
        text: btn.text || btn.title || "Botão",
        url: btn.url,
        phone: btn.phone_number
      })))
    }
  } catch {}
  
  // Also extract buttons from data content if present
  // Pattern: {{n}} | [text,url] or [text] on its own line
  if (data) {
    // Match patterns like: {{1}} | [Clique aqui,https://example.com]
    const buttonPatternWithVar = /\{\{\d+\}\}\s*\|\s*\[([^\],]+)(?:,([^\]]+))?\]/g
    let match
    while ((match = buttonPatternWithVar.exec(data)) !== null) {
      const text = match[1].trim()
      const url = match[2]?.trim()
      // Avoid duplicates
      if (!buttons.some(b => b.text === text)) {
        buttons.push({
          type: url ? "URL" : "QUICK_REPLY",
          text,
          url
        })
      }
    }
    
    // Match patterns on separate lines: [text] without variable
    const buttonPatternAlone = /^\s*\[([^\],]+)\]\s*$/gm
    while ((match = buttonPatternAlone.exec(data)) !== null) {
      const text = match[1].trim()
      if (!buttons.some(b => b.text === text)) {
        buttons.push({
          type: "QUICK_REPLY",
          text
        })
      }
    }
  }
  
  return buttons
}

// Clean content for display - remove button patterns and format variables
function cleanContentForDisplay(data: string): string {
  if (!data) return "Sem conteúdo"
  
  let content = data
  
  // Remove button patterns: {{n}} | [text,url] or {{n}} | [text]
  content = content.replace(/\n?\s*\{\{\d+\}\}\s*\|\s*\[[^\]]*\]/g, '')
  
  // Remove standalone button patterns: [text] on its own line at end
  content = content.replace(/\n\s*\[[^\]]*\]\s*$/g, '')
  
  // Remove trailing [text] patterns
  content = content.replace(/\s*\|\s*\[[^\]]*\]/g, '')
  
  // Clean up multiple newlines
  content = content.replace(/\n{3,}/g, '\n\n')
  
  // Trim
  content = content.trim()
  
  return content || "Sem conteúdo"
}

// Parse header from containerMeta
function parseHeader(containerMeta: string): { type?: string; text?: string } | null {
  try {
    const meta = JSON.parse(containerMeta)
    if (meta.header) {
      return {
        type: meta.header.type,
        text: meta.header.text
      }
    }
  } catch {}
  return null
}

// Parse footer from containerMeta
function parseFooter(containerMeta: string): string | null {
  try {
    const meta = JSON.parse(containerMeta)
    if (meta.footer) {
      return meta.footer
    }
  } catch {}
  return null
}

// Parse example content from meta (with variable values filled in)
function parseExample(metaString: string): string | null {
  try {
    const meta = JSON.parse(metaString)
    if (meta.example) {
      return meta.example
    }
  } catch {}
  return null
}

// Parse cards from containerMeta for CAROUSEL templates
function parseCards(containerMeta: string): CarouselCardData[] {
  try {
    const meta = JSON.parse(containerMeta)
    
    // Formato 1: cards diretamente no meta
    if (meta.cards && Array.isArray(meta.cards)) {
      return meta.cards
    }
    
    // Formato 2: carousel com items/cards dentro
    if (meta.carousel?.cards && Array.isArray(meta.carousel.cards)) {
      return meta.carousel.cards
    }
    
    // Formato 3: components com type CAROUSEL
    if (meta.components && Array.isArray(meta.components)) {
      const carouselComp = meta.components.find((c: any) => c.type === 'CAROUSEL')
      if (carouselComp?.cards) {
        return carouselComp.cards
      }
    }
    
    // Formato 4: templateCards (formato alternativo)
    if (meta.templateCards && Array.isArray(meta.templateCards)) {
      return meta.templateCards
    }
    
    // Formato 5: carouselCards
    if (meta.carouselCards && Array.isArray(meta.carouselCards)) {
      return meta.carouselCards
    }
    
    // Formato 6: items (alguns APIs usam)
    if (meta.items && Array.isArray(meta.items)) {
      return meta.items
    }
  } catch {}
  return []
}

// Build card media URL
function buildCardMediaUrl(
  card: CarouselCardData,
  sourceAppId?: string,
  token?: string
): string | null {
  // 1. Verificar se tem mediaUrl/imageUrl diretamente no card
  const cardAny = card as any
  if (cardAny.mediaUrl && typeof cardAny.mediaUrl === 'string' && cardAny.mediaUrl.startsWith('http')) {
    return `/api/proxy/media?url=${encodeURIComponent(cardAny.mediaUrl)}`
  }
  if (cardAny.imageUrl && typeof cardAny.imageUrl === 'string' && cardAny.imageUrl.startsWith('http')) {
    return `/api/proxy/media?url=${encodeURIComponent(cardAny.imageUrl)}`
  }
  if (cardAny.image && typeof cardAny.image === 'string' && cardAny.image.startsWith('http')) {
    return `/api/proxy/media?url=${encodeURIComponent(cardAny.image)}`
  }
  
  // 2. Look for header component with image/video
  const headerComp = card.components?.find(c => c.type === "HEADER")
  
  if (headerComp) {
    const h = headerComp as any
    
    // Formato 1: example.header_handle array
    if (headerComp.example?.header_handle?.[0]) {
      const url = headerComp.example.header_handle[0]
      if (url.startsWith("http")) {
        return `/api/proxy/media?url=${encodeURIComponent(url)}`
      }
    }
    
    // Formato 2: mediaUrl direto no header
    if (h.mediaUrl && typeof h.mediaUrl === 'string' && h.mediaUrl.startsWith('http')) {
      return `/api/proxy/media?url=${encodeURIComponent(h.mediaUrl)}`
    }
    
    // Formato 3: example como string
    if (h.example && typeof h.example === 'string' && h.example.startsWith('http')) {
      return `/api/proxy/media?url=${encodeURIComponent(h.example)}`
    }
    
    // Formato 4: url direto no header
    if (h.url && typeof h.url === 'string' && h.url.startsWith('http')) {
      return `/api/proxy/media?url=${encodeURIComponent(h.url)}`
    }
    
    // Formato 5: handle array
    if (h.handle && Array.isArray(h.handle) && h.handle[0]?.startsWith('http')) {
      return `/api/proxy/media?url=${encodeURIComponent(h.handle[0])}`
    }
  }
  
  return null
}

// Determina se o card tem mídia (imagem ou vídeo)
function getCardMediaType(card: CarouselCardData): 'IMAGE' | 'VIDEO' | null {
  const cardAny = card as any
  
  // Verifica URLs diretas no card
  if (cardAny.mediaUrl || cardAny.imageUrl || cardAny.image) {
    const url = cardAny.mediaUrl || cardAny.imageUrl || cardAny.image
    if (typeof url === 'string') {
      if (url.match(/\.(mp4|webm|mov|avi)/i)) return 'VIDEO'
      return 'IMAGE'
    }
  }
  
  // Verifica header component
  const headerComp = card.components?.find(c => c.type === "HEADER")
  if (headerComp) {
    const h = headerComp as any
    if (h.format === 'VIDEO') return 'VIDEO'
    if (h.format === 'IMAGE') return 'IMAGE'
    // Se tem example/handle mas não tem format definido, assumir imagem
    if (h.example?.header_handle?.[0] || h.example || h.mediaUrl || h.url) {
      return 'IMAGE'
    }
  }
  
  return null
}

// Get card body text
function getCardBodyText(card: CarouselCardData): string {
  const bodyComp = card.components?.find(c => c.type === "BODY")
  if (bodyComp?.text) {
    // Replace variables with example values if available
    let text = bodyComp.text
    if (bodyComp.example?.body_text?.[0]) {
      bodyComp.example.body_text[0].forEach((value, index) => {
        text = text.replace(`{{${index + 1}}}`, value)
      })
    }
    return text
  }
  return ""
}

// Get card buttons
function getCardButtons(card: CarouselCardData): Array<{ type: string; text: string; url?: string; phone?: string }> {
  const buttonsComp = card.components?.find(c => c.type === "BUTTONS")
  if (buttonsComp?.buttons) {
    return buttonsComp.buttons.map(btn => ({
      type: btn.type || "QUICK_REPLY",
      text: btn.text || "Botão",
      url: btn.url,
      phone: btn.phone_number
    }))
  }
  return []
}

// Parse media info from meta, containerMeta or template
function parseMediaInfo(template: GupshupTemplate): { url: string | null; mediaId: string | null } {
  let url: string | null = null
  let mediaId: string | null = null
  
  // Try direct mediaUrl on template
  if (template.mediaUrl) url = template.mediaUrl
  
  // Try meta JSON
  try {
    const meta = JSON.parse(template.meta || "{}")
    if (!url && meta.mediaUrl) url = meta.mediaUrl
    if (!url && meta.exampleMedia) url = meta.exampleMedia
    if (meta.mediaId) mediaId = meta.mediaId
    // Tentar buscar no exampleHeader (formato Gupshup para mídia)
    if (!url && meta.exampleHeader) url = meta.exampleHeader
  } catch {}
  
  // Try containerMeta JSON - formato mais robusto para Gupshup
  try {
    const containerMeta = JSON.parse(template.containerMeta || "{}")
    if (!url && containerMeta.mediaUrl) url = containerMeta.mediaUrl
    if (!url && containerMeta.exampleMedia) url = containerMeta.exampleMedia
    if (!mediaId && containerMeta.mediaId) mediaId = containerMeta.mediaId
    
    // Buscar no exampleHeader (usado em templates IMAGE/VIDEO/DOCUMENT)
    if (!url && containerMeta.exampleHeader) url = containerMeta.exampleHeader
    if (!url && containerMeta.sampleHeader) url = containerMeta.sampleHeader
    
    // Buscar no header se for objeto com example/handle
    if (!url && containerMeta.header) {
      const h = containerMeta.header
      // header.example pode ser string (URL) ou objeto { header_handle: [url] }
      if (typeof h.example === 'string') url = h.example
      else if (h.example?.header_handle?.[0]) url = h.example.header_handle[0]
      // Outras variações comuns
      if (!url && h.mediaUrl) url = h.mediaUrl
      if (!url && h.url) url = h.url
    }
  } catch {}
  
  return { url, mediaId }
}

// Build proxy URL for media
function buildMediaProxyUrl(
  mediaInfo: { url: string | null; mediaId: string | null },
  sourceAppId?: string,
  token?: string
): string | null {
  // Se tem URL direta, usar proxy para evitar CORS
  if (mediaInfo.url) {
    return `/api/proxy/media?url=${encodeURIComponent(mediaInfo.url)}`
  }
  
  // Se tem mediaId e temos appId e token, construir URL do proxy
  if (mediaInfo.mediaId && sourceAppId && token) {
    return `/api/proxy/media?mediaId=${encodeURIComponent(mediaInfo.mediaId)}&appId=${encodeURIComponent(sourceAppId)}`
  }
  
  return null
}

// Format date like WhatsApp
function formatDate(timestamp?: number): string {
  if (!timestamp) return "-"
  const date = new Date(timestamp)
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Format time like WhatsApp
function formatTime(timestamp?: number): string {
  if (!timestamp) return "12:00"
  const date = new Date(timestamp)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// Render content with highlighted variables
function ContentWithVariables({ content }: { content: string }) {
  // Split content by variable pattern {{n}}
  const parts = content.split(/(\{\{\d+\}\})/g)
  
  return (
    <>
      {parts.map((part, i) => {
        // Check if this part is a variable
        if (/^\{\{\d+\}\}$/.test(part)) {
          return (
            <span
              key={i}
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-[#00a884]/30 text-[#00e5ff] text-[11px] font-mono font-medium"
            >
              {part}
            </span>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

export function TemplateCard({ template, selected, onToggle, sourceAppId, token }: TemplateCardProps) {
  const buttons = parseButtons(template.containerMeta || "{}", template.data)
  const header = parseHeader(template.containerMeta || "{}")
  const footer = parseFooter(template.containerMeta || "{}")
  const mediaInfo = parseMediaInfo(template)
  const mediaUrl = buildMediaProxyUrl(mediaInfo, sourceAppId, token)
  const example = parseExample(template.meta || "{}")
  // Tentar buscar cards em containerMeta e meta
  let cards = parseCards(template.containerMeta || "{}")
  if (cards.length === 0) {
    cards = parseCards(template.meta || "{}")
  }
  const hasMedia = ["IMAGE", "VIDEO", "DOCUMENT"].includes(template.templateType?.toUpperCase())
  const isImage = template.templateType?.toUpperCase() === "IMAGE"
  const isVideo = template.templateType?.toUpperCase() === "VIDEO"
  const isDocument = template.templateType?.toUpperCase() === "DOCUMENT"
  const isCarousel = template.templateType?.toUpperCase() === "CAROUSEL" || cards.length > 0
  const modifiedDate = formatDate(template.modifiedOn)
  const modifiedTime = formatTime(template.modifiedOn)
  
  // Use example (with filled values) if available, otherwise use data (with variables)
  const displayContent = example || template.data
  const cleanedContent = cleanContentForDisplay(displayContent)
  // Check if we're showing the example (no variables) or data (with variables)
  const hasVariables = !example && /\{\{\d+\}\}/.test(cleanedContent)

  return (
    <div
      onClick={onToggle}
      className={cn(
        "relative cursor-pointer rounded-xl overflow-hidden group",
        selected
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/10"
          : "hover:ring-1 hover:ring-primary/40 hover:ring-offset-1 hover:ring-offset-background hover:shadow-md hover:shadow-primary/5"
      )}
    >
      {/* Header com nome do template e badge de status */}
      <div className="bg-gradient-to-r from-[#1a2c38] to-[#202c33] px-3 py-2.5 flex items-center justify-between gap-2 border-b border-white/5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            className="shrink-0 border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="truncate text-sm font-medium text-white/95">
            {template.elementName}
          </span>
        </div>
        <Badge variant="outline" className={cn("text-[10px] shrink-0 border font-semibold", statusColor(template.status))}>
          {statusLabel(template.status)}
        </Badge>
      </div>

      {/* WhatsApp chat background pattern */}
      <div 
        className="relative p-4"
        style={{
          backgroundColor: '#0b141a',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      >
        {/* Carousel - com cards ou placeholder */}
        {isCarousel ? (
          cards.length > 0 ? (
          <div className="relative">
            {/* Carousel indicator */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-1.5 text-white/60">
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="text-[10px] uppercase tracking-wider">Carousel • {cards.length} cards</span>
              </div>
              <div className="flex items-center gap-1">
                <ChevronLeft className="h-4 w-4 text-white/40" />
                <ChevronRight className="h-4 w-4 text-white/40" />
              </div>
            </div>
            
            {/* Cards horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {cards.map((card, index) => {
                const cardMediaUrl = buildCardMediaUrl(card, sourceAppId, token)
                const cardBodyText = getCardBodyText(card)
                const cardButtons = getCardButtons(card)
                const cardMediaType = getCardMediaType(card)
                const isCardImage = cardMediaType === 'IMAGE'
                const isCardVideo = cardMediaType === 'VIDEO'
                const hasCardMedia = isCardImage || isCardVideo
                
                return (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[200px] snap-start bg-[#005c4b] rounded-lg overflow-hidden shadow-lg"
                  >
                    {/* Card media - sempre mostrar área de mídia no carousel */}
                    <div className="relative border-b border-[#ffffff10] overflow-hidden">
                      {cardMediaUrl ? (
                        isCardVideo ? (
                          <div className="relative w-full h-[100px] bg-[#025144]">
                            <video
                              src={cardMediaUrl}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="bg-black/50 rounded-full p-2">
                                <Video className="h-5 w-5 text-white" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={cardMediaUrl}
                            alt={`Card ${index + 1}`}
                            className="w-full h-[100px] object-cover"
                            onError={(e) => {
                              const parent = e.currentTarget.parentElement
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="bg-[#025144] flex items-center justify-center h-[100px]">
                                    <div class="flex flex-col items-center gap-1 text-white/60">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                      <span class="text-[9px] uppercase tracking-wider">Imagem</span>
                                    </div>
                                  </div>
                                `
                              }
                            }}
                          />
                        )
                      ) : (
                        <div className="bg-[#025144] flex items-center justify-center h-[100px]">
                          <div className="flex flex-col items-center gap-1 text-white/60">
                            {isCardVideo ? <Video className="h-5 w-5" /> : <Image className="h-5 w-5" />}
                            <span className="text-[9px] uppercase tracking-wider">
                              {isCardVideo ? "Vídeo" : "Imagem"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Card body */}
                    {cardBodyText && (
                      <div className="px-2 py-1.5">
                        <p className="text-[11px] text-white/95 leading-relaxed line-clamp-3">
                          {cardBodyText}
                        </p>
                      </div>
                    )}
                    
                    {/* Card buttons */}
                    {cardButtons.length > 0 && (
                      <div className="border-t border-[#ffffff15]">
                        {cardButtons.slice(0, 2).map((btn, btnIndex) => (
                          <div
                            key={btnIndex}
                            className={cn(
                              "flex items-center justify-center gap-1 py-1.5 text-[#00a884] text-[11px] font-medium",
                              btnIndex > 0 && "border-t border-[#ffffff15]"
                            )}
                          >
                            {btn.type === "URL" && <ExternalLink className="h-3 w-3" />}
                            {btn.type === "QUICK_REPLY" && <Reply className="h-3 w-3" />}
                            <span className="truncate max-w-[150px]">{btn.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Body text below carousel if exists */}
            {cleanedContent && cleanedContent !== "Sem conteúdo" && (
              <div className="mt-2 bg-[#005c4b] rounded-lg p-2 shadow-lg max-w-[280px] ml-auto">
                <p className="text-[12px] text-white/95 leading-relaxed whitespace-pre-wrap break-words">
                  {hasVariables ? (
                    <ContentWithVariables content={cleanedContent} />
                  ) : (
                    cleanedContent
                  )}
                </p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-white/50">{modifiedTime}</span>
                  <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                </div>
              </div>
            )}
          </div>
          ) : (
          /* Carousel sem cards - placeholder */
          <div className="relative max-w-[280px] ml-auto">
            <div className="bg-[#005c4b] rounded-lg overflow-hidden shadow-lg">
              <div className="bg-[#025144] p-4">
                <div className="flex items-center justify-center gap-2 text-white/60 mb-2">
                  <LayoutGrid className="h-5 w-5" />
                  <span className="text-xs uppercase tracking-wider">Carousel</span>
                </div>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-16 h-20 bg-[#0b3d36] rounded flex items-center justify-center">
                      <Image className="h-4 w-4 text-white/40" />
                    </div>
                  ))}
                </div>
              </div>
              {/* Message content */}
              <div className="px-3 py-2">
                <p className="text-[13px] text-white/95 leading-relaxed whitespace-pre-wrap break-words">
                  {hasVariables ? (
                    <ContentWithVariables content={cleanedContent} />
                  ) : (
                    cleanedContent
                  )}
                </p>
              </div>
              {/* Time and read receipt */}
              <div className="flex items-center justify-end gap-1 px-3 pb-2">
                <span className="text-[10px] text-white/50">{modifiedTime}</span>
                <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
              </div>
            </div>
          </div>
          )
        ) : (
        /* Message bubble - for non-carousel templates */
        <div className="relative max-w-[280px] ml-auto">
          {/* Bubble tail */}
          <div 
            className="absolute -right-2 top-0 w-4 h-4"
            style={{
              background: '#005c4b',
              clipPath: 'polygon(0 0, 100% 0, 0 100%)'
            }}
          />
          
          <div className="bg-[#005c4b] rounded-lg rounded-tr-none overflow-hidden shadow-lg">
            {/* Media preview area */}
            {hasMedia && (
              <div className="relative border-b border-[#ffffff10] overflow-hidden">
                {/* Image */}
                {isImage && mediaUrl && (
                  <img 
                    src={mediaUrl} 
                    alt="Template media" 
                    className="w-full h-auto max-h-[200px] object-cover"
                    onError={(e) => {
                      // Fallback to placeholder on error
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                )}
                
                {/* Video */}
                {isVideo && mediaUrl && (
                  <div className="relative">
                    <video 
                      src={mediaUrl} 
                      className="w-full h-auto max-h-[200px] object-cover"
                      muted
                      playsInline
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="bg-black/50 rounded-full p-3">
                        <Video className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Document - WhatsApp style with preview */}
                {isDocument && (
                  <div className="bg-[#025144]">
                    {/* Preview area - se tiver URL */}
                    {mediaUrl ? (
                      <div className="relative">
                        {/* Tentar mostrar preview do PDF usando object */}
                        <div className="w-full h-[120px] bg-white flex items-center justify-center overflow-hidden">
                          <object
                            data={mediaUrl}
                            type="application/pdf"
                            className="w-full h-full"
                          >
                            {/* Fallback visual quando PDF não pode ser renderizado */}
                            <div className="w-full h-full bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col items-center justify-center p-3">
                              <div className="bg-white rounded shadow-md p-4 w-[80%] h-[80%] flex flex-col">
                                <div className="h-1.5 bg-gray-300 rounded w-3/4 mb-2"></div>
                                <div className="h-1 bg-gray-200 rounded w-full mb-1"></div>
                                <div className="h-1 bg-gray-200 rounded w-5/6 mb-1"></div>
                                <div className="h-1 bg-gray-200 rounded w-4/6 mb-1"></div>
                                <div className="h-1 bg-gray-200 rounded w-full mb-1"></div>
                                <div className="h-1 bg-gray-200 rounded w-3/4"></div>
                              </div>
                            </div>
                          </object>
                        </div>
                        {/* Document info bar */}
                        <div className="flex items-center gap-3 bg-[#0b3d36] p-2.5">
                          <div className="flex-shrink-0 bg-[#ff5722] rounded p-1.5">
                            <File className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-white font-medium truncate">
                              documento.pdf
                            </p>
                            <p className="text-[10px] text-white/50">
                              PDF • Toque para abrir
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Sem URL - mostrar placeholder visual */
                      <div className="p-3">
                        <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg p-3 mb-2">
                          <div className="bg-white rounded shadow-sm p-3 flex flex-col gap-1.5">
                            <div className="h-1.5 bg-gray-300 rounded w-3/4"></div>
                            <div className="h-1 bg-gray-200 rounded w-full"></div>
                            <div className="h-1 bg-gray-200 rounded w-5/6"></div>
                            <div className="h-1 bg-gray-200 rounded w-4/6"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-[#0b3d36] rounded-lg p-2.5">
                          <div className="flex-shrink-0 bg-[#ff5722] rounded p-1.5">
                            <File className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-white font-medium truncate">
                              documento.pdf
                            </p>
                            <p className="text-[10px] text-white/50">
                              PDF • Documento
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Fallback placeholder (shown when no mediaUrl or on error for IMAGE/VIDEO) */}
                <div className={cn(
                  "bg-[#025144] flex items-center justify-center p-6",
                  isDocument ? "hidden" : "",
                  (mediaUrl && (isImage || isVideo)) ? "hidden" : ""
                )}>
                  <div className="flex flex-col items-center gap-2 text-white/60">
                    <TemplateTypeIcon type={template.templateType} />
                    <span className="text-[10px] uppercase tracking-wider">
                      {isImage ? "Imagem" : 
                       isVideo ? "Vídeo" : 
                       template.templateType}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Header text if exists */}
            {header?.text && (
              <div className="px-3 pt-2">
                <p className="text-[13px] font-semibold text-white leading-tight">
                  {header.text}
                </p>
              </div>
            )}
            
            {/* Message content */}
            <div className="px-3 py-2">
              <p className="text-[13px] text-white/95 leading-relaxed whitespace-pre-wrap break-words">
                {hasVariables ? (
                  <ContentWithVariables content={cleanedContent} />
                ) : (
                  cleanedContent
                )}
              </p>
            </div>
            
            {/* Footer text if exists */}
            {footer && (
              <div className="px-3 pb-1">
                <p className="text-[11px] text-white/50">
                  {footer}
                </p>
              </div>
            )}
            
            {/* Time and read receipt */}
            <div className="flex items-center justify-end gap-1 px-3 pb-2">
              <span className="text-[10px] text-white/50">{modifiedTime}</span>
              <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
            </div>
            
            {/* Buttons */}
            {buttons.length > 0 && (
              <div className="border-t border-[#ffffff15]">
                {buttons.map((btn, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-center gap-2 py-2.5 text-[#00a884] text-sm font-medium",
                      i > 0 && "border-t border-[#ffffff15]"
                    )}
                  >
                    {btn.type === "URL" && <ExternalLink className="h-4 w-4" />}
                    {btn.type === "PHONE_NUMBER" && <Phone className="h-4 w-4" />}
                    {btn.type === "COPY_CODE" && <Copy className="h-4 w-4" />}
                    {btn.type === "QUICK_REPLY" && <Reply className="h-4 w-4" />}
                    <span>{btn.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Footer com informações adicionais */}
      <div className="bg-[#111b21] px-3 py-2 flex items-center justify-between">
        <span className="text-[11px] text-white/40">
          Última atualização: {modifiedDate}
        </span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px] text-white/50 border-white/20 py-0 h-4">
            {template.category}
          </Badge>
          <Badge variant="outline" className="text-[9px] text-white/50 border-white/20 py-0 h-4">
            {template.languageCode}
          </Badge>
          <Info className="h-3.5 w-3.5 text-white/30" />
        </div>
      </div>
    </div>
  )
}

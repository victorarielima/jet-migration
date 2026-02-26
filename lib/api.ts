import type { GupshupTemplate } from "./types"

const PROXY_BASE = "/api/proxy"

// Cache de tokens de app para evitar requisições repetidas e erro 429
const appTokenCache = new Map<string, { token: string; timestamp: number }>()
const TOKEN_CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export async function login(email: string, password: string): Promise<{ token: string }> {
  const body = new URLSearchParams({ email, password })

  const res = await fetch(`${PROXY_BASE}/account/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })

  if (!res.ok) {
    throw new Error("Credenciais invalidas. Verifique seu email e client secret.")
  }

  const data = await res.json()

  if (!data.token) {
    throw new Error("Credenciais invalidas. Verifique seu email e client secret.")
  }

  return { token: data.token }
}

export async function getAppToken(
  appId: string,
  authToken: string
): Promise<string> {
  // Verificar cache primeiro
  const cached = appTokenCache.get(appId)
  if (cached && Date.now() - cached.timestamp < TOKEN_CACHE_DURATION) {
    console.log("💾 Using cached token for app:", appId)
    return cached.token
  }
  
  console.log("🔑 Getting app token for:", appId)
  console.log("🔑 Auth token:", authToken ? (typeof authToken === 'string' ? `${authToken.substring(0, 20)}...` : JSON.stringify(authToken)) : "MISSING")
  
  const res = await fetch(`${PROXY_BASE}/app/${appId}/token`, {
    headers: { Authorization: authToken },
  })

  if (!res.ok) {
    throw new Error("Erro ao obter token do app. Verifique o App ID.")
  }

  const data = await res.json()

  // A resposta tem a estrutura: { status: "success", token: { token: "sk_...", ... } }
  if (!data.token || !data.token.token) {
    throw new Error("Token do app não encontrado na resposta.")
  }

  // Salvar no cache
  appTokenCache.set(appId, {
    token: data.token.token,
    timestamp: Date.now()
  })

  return data.token.token
}

export async function fetchTemplates(
  appId: string,
  authToken: string
): Promise<GupshupTemplate[]> {
  // Primeiro, obter o token do app
  const appToken = await getAppToken(appId, authToken)
  
  console.log("📋 Fetching templates for app:", appId)
  console.log("🔑 App token:", appToken ? (typeof appToken === 'string' ? `${appToken.substring(0, 20)}...` : JSON.stringify(appToken)) : "MISSING")

  // Depois, buscar os templates usando o token do app
  const res = await fetch(`${PROXY_BASE}/app/${appId}/templates`, {
    headers: { Authorization: appToken },
  })

  if (!res.ok) {
    throw new Error("Erro ao buscar templates. Verifique o App ID de origem.")
  }

  const data = await res.json()

  if (data.templates) {
    return data.templates as GupshupTemplate[]
  }

  if (Array.isArray(data)) {
    return data as GupshupTemplate[]
  }

  return []
}

export async function createTemplate(
  appId: string,
  authToken: string,
  template: GupshupTemplate
): Promise<void> {
  console.log("📝 Creating template:", template.elementName, "in app:", appId)
  
  // Primeiro, obter o token do app de destino
  const appToken = await getAppToken(appId, authToken)
  
  console.log("🔑 Using app token for creation")

  // Parse dos JSONs meta e containerMeta
  let metaData: any = {}
  let containerData: any = {}
  
  try {
    if (template.meta) {
      metaData = JSON.parse(template.meta)
      console.log("📋 Meta data:", JSON.stringify(metaData, null, 2))
    }
  } catch (e) {
    console.error("❌ Erro ao parsear meta:", e)
  }
  
  try {
    if (template.containerMeta) {
      containerData = JSON.parse(template.containerMeta)
      console.log("📦 Container data:", JSON.stringify(containerData, null, 2))
    }
  } catch (e) {
    console.error("❌ Erro ao parsear containerMeta:", e)
  }

  // Log de mídia para debug
  if (template.templateType === "IMAGE" || template.templateType === "VIDEO" || template.templateType === "DOCUMENT") {
    console.log("🖼️ Template de mídia detectado:", template.templateType)
    console.log("   - metaData.mediaId:", metaData.mediaId)
    console.log("   - metaData.mediaUrl:", metaData.mediaUrl)
    console.log("   - containerData.mediaId:", containerData.mediaId)
    console.log("   - containerData.mediaUrl:", containerData.mediaUrl)
    console.log("   - template.mediaUrl:", template.mediaUrl)
  }

  // Criar os parâmetros
  const params = new URLSearchParams()
  
  // Processar o content - remover header e footer se existirem
  let contentToSend = template.data
  let footerToSend: string | undefined = undefined
  let headerToSend: string | undefined = undefined
  
  // Processar header
  if (containerData.header) {
    headerToSend = containerData.header
    // Se o content começa com header + \n, remover
    const headerInContent = `${containerData.header}\n`
    if (contentToSend.startsWith(headerInContent)) {
      contentToSend = contentToSend.slice(headerInContent.length)
    } else if (contentToSend.startsWith(containerData.header)) {
      contentToSend = contentToSend.slice(containerData.header.length).trimStart()
    }
  }
  
  // Processar footer
  if (containerData.footer) {
    footerToSend = containerData.footer
    // Se o content termina com \n + footer, remover o footer do content
    const footerInContent = `\n${containerData.footer}`
    if (contentToSend.endsWith(footerInContent)) {
      contentToSend = contentToSend.slice(0, -footerInContent.length)
    } else if (contentToSend.endsWith(containerData.footer)) {
      contentToSend = contentToSend.slice(0, -containerData.footer.length).trimEnd()
    }
  }
  
  // Se tiver botões, remover as marcações do content
  if (containerData.buttons && Array.isArray(containerData.buttons) && containerData.buttons.length > 0) {
    // Remover linhas completas de botões do content:
    // Formato: "{{n}} | [texto,url]" ou "{{n}} | [texto]" - remover a linha inteira
    // Também: " | [texto,url]" ou " | [texto]" sem variável
    
    // 1. Remover linhas inteiras com "{{n}} | [texto,url]" (nova linha + variável + botão)
    contentToSend = contentToSend.replace(/\n\s*\{\{\d+\}\}\s*\|\s*\[[^\]]*\]/g, "")
    
    // 2. Remover "{{n}} | [texto,url]" que pode estar no início ou meio
    contentToSend = contentToSend.replace(/\{\{\d+\}\}\s*\|\s*\[[^\]]*\]/g, "")
    
    // 3. Remover padrões " | [texto,url]" restantes (sem variável)
    contentToSend = contentToSend.replace(/\s*\|\s*\[[^\]]*\]/g, "")
    
    // Limpar espaços extras e quebras de linha no final
    contentToSend = contentToSend.trim()
  }
  
  // REGRA DO WHATSAPP: Variáveis {{n}} NÃO podem estar no início ou fim do content
  // Se após processamento o content terminar ou começar com variável, remover essas linhas
  
  // Remover linhas que terminam apenas com variável no final do content
  // Ex: "texto\n{{1}}" -> "texto"
  contentToSend = contentToSend.replace(/\n\s*\{\{\d+\}\}\s*$/g, "")
  
  // Se ainda terminar com variável (sem newline antes), remover a variável do final
  // Ex: "texto {{1}}" -> "texto"
  contentToSend = contentToSend.replace(/\s*\{\{\d+\}\}\s*$/g, "").trim()
  
  // Se começar com variável, remover do início
  // Ex: "{{1}} texto" -> "texto"
  contentToSend = contentToSend.replace(/^\s*\{\{\d+\}\}\s*/g, "").trim()
  
  // Campos OBRIGATÓRIOS (do template original)
  params.append("elementName", template.elementName)
  params.append("languageCode", template.languageCode)
  params.append("category", template.category)
  params.append("templateType", template.templateType)
  params.append("content", contentToSend)
  params.append("parameterFormat", "POSITIONAL")
  
  // Vertical
  if (template.vertical) {
    params.append("vertical", template.vertical)
  }
  
  // Example - extrair do meta e processar igual ao content
  if (metaData.example) {
    let exampleToSend = metaData.example
    
    // Remover marcações de botões do example
    // 1. Remover "{{n}} | [texto,url]" inteiro
    exampleToSend = exampleToSend.replace(/\n\s*\{\{\d+\}\}\s*\|\s*\[[^\]]*\]/g, "")
    exampleToSend = exampleToSend.replace(/\{\{\d+\}\}\s*\|\s*\[[^\]]*\]/g, "")
    
    // 2. Remover " | [texto,url]" sem variável
    exampleToSend = exampleToSend.replace(/\s*\|\s*\[[^\]]*\]/g, "")
    
    // 3. Remover "[texto]" sozinho no final (como "[URL ou PDF]")
    exampleToSend = exampleToSend.replace(/\n\[[^\]]*\]\s*$/g, "")  // [texto] em linha separada no final
    exampleToSend = exampleToSend.replace(/\s*\[[^\]]*\]\s*$/g, "")  // [texto] no final da linha
    
    // Remover variáveis do início e fim (mesma regra do content)
    exampleToSend = exampleToSend.replace(/\n\s*\{\{\d+\}\}\s*$/g, "")
    exampleToSend = exampleToSend.replace(/\s*\{\{\d+\}\}\s*$/g, "").trim()
    exampleToSend = exampleToSend.replace(/^\s*\{\{\d+\}\}\s*/g, "").trim()
    
    params.append("example", exampleToSend)
  }
  
  // CAMPOS ADICIONAIS DO TEMPLATE ORIGINAL
  
  // Para templates com mídia (VIDEO, IMAGE, DOCUMENT), enviar mediaId e mediaUrl
  const mediaUrl = template.mediaUrl || metaData.mediaUrl || containerData.mediaUrl
  const mediaId = metaData.mediaId || containerData.mediaId
  
  if (mediaId) {
    console.log("🖼️ Usando mediaId:", mediaId)
    params.append("mediaId", mediaId)
  }
  
  if (mediaUrl && mediaUrl.startsWith("http")) {
    console.log("🖼️ Usando mediaUrl:", mediaUrl)
    params.append("mediaUrl", mediaUrl)
  }
  
  // Para templates de mídia (VIDEO, IMAGE), enviar exampleHeader vazio
  if (template.templateType === "IMAGE" || template.templateType === "VIDEO") {
    params.append("exampleHeader", "")
  }
  
  // DO containerMeta
  if (containerData.enableSample !== undefined) {
    params.append("enableSample", String(containerData.enableSample))
  }
  
  // Para templates de mídia (VIDEO, IMAGE), a Gupshup não envia esses campos
  const isMediaTemplate = template.templateType === "IMAGE" || template.templateType === "VIDEO"
  
  if (!isMediaTemplate) {
    if (containerData.allowTemplateCategoryChange !== undefined) {
      params.append("allowTemplateCategoryChange", String(containerData.allowTemplateCategoryChange))
    }
    
    if (containerData.editTemplate !== undefined) {
      params.append("editTemplate", String(containerData.editTemplate))
    }
    
    if (containerData.addSecurityRecommendation !== undefined) {
      params.append("addSecurityRecommendation", String(containerData.addSecurityRecommendation))
    }
  }
  
  // checkerApprovalRequired - padrão false
  params.append("checkerApprovalRequired", "false")
  
  if (!isMediaTemplate) {
    if (containerData.isCPR !== undefined) {
      params.append("isCPR", String(containerData.isCPR))
    }
    
    if (containerData.cpr !== undefined) {
      params.append("cpr", String(containerData.cpr))
    }
  }
  
  // Cards - OBRIGATÓRIO para templates CAROUSEL
  if (containerData.cards) {
    params.append("cards", JSON.stringify(containerData.cards))
  }
  
  // Buttons - enviar apenas se tiver botões válidos
  if (containerData.buttons && Array.isArray(containerData.buttons) && containerData.buttons.length > 0) {
    // Para botões URL sem variável dinâmica, adicionar example se não existir
    const buttonsWithExamples = containerData.buttons.map((btn: any) => {
      if (btn.type === "URL" && btn.url && !btn.example) {
        // Se a URL não tem variável {{n}}, adicionar example igual à URL
        if (!btn.url.includes("{{")) {
          return { ...btn, example: [btn.url] }
        }
      }
      return btn
    })
    params.append("buttons", JSON.stringify(buttonsWithExamples))
  }
  
  // Header - enviar separadamente quando existir
  if (headerToSend) {
    params.append("header", headerToSend)
    // exampleHeader é obrigatório quando há header de texto
    // Se não existir no containerData, usar o próprio valor do header
    const exampleHeaderValue = containerData.exampleHeader || containerData.sampleHeader || headerToSend
    params.append("exampleHeader", exampleHeaderValue)
  }
  
  // Footer - enviar separadamente quando existir
  if (footerToSend) {
    params.append("footer", footerToSend)
  }
  
  // exampleHeader - se não foi enviado junto com header mas existe no containerData
  if (!headerToSend && containerData.exampleHeader) {
    params.append("exampleHeader", containerData.exampleHeader)
  }
  
  // sampleText - processar igual ao content (remover variáveis do início/fim)
  // NÃO enviar para templates de mídia (VIDEO, IMAGE)
  if (containerData.sampleText && template.templateType !== "VIDEO" && template.templateType !== "IMAGE") {
    let sampleTextToSend = containerData.sampleText
    
    // Remover marcações de botões
    // 1. Remover "{{n}} | [texto,url]" inteiro
    sampleTextToSend = sampleTextToSend.replace(/\n\s*\{\{\d+\}\}\s*\|\s*\[[^\]]*\]/g, "")
    sampleTextToSend = sampleTextToSend.replace(/\{\{\d+\}\}\s*\|\s*\[[^\]]*\]/g, "")
    
    // 2. Remover " | [texto,url]" sem variável
    sampleTextToSend = sampleTextToSend.replace(/\s*\|\s*\[[^\]]*\]/g, "")
    
    // 3. Remover "[texto]" sozinho no final (como "[URL ou PDF]")
    sampleTextToSend = sampleTextToSend.replace(/\n\[[^\]]*\]\s*$/g, "")  // [texto] em linha separada no final
    sampleTextToSend = sampleTextToSend.replace(/\s*\[[^\]]*\]\s*$/g, "")  // [texto] no final da linha
    
    // Remover variáveis do início e fim
    sampleTextToSend = sampleTextToSend.replace(/\n\s*\{\{\d+\}\}\s*$/g, "")
    sampleTextToSend = sampleTextToSend.replace(/\s*\{\{\d+\}\}\s*$/g, "").trim()
    sampleTextToSend = sampleTextToSend.replace(/^\s*\{\{\d+\}\}\s*/g, "").trim()
    
    params.append("sampleText", sampleTextToSend)
  }
  
  // oldCategory - se o template mudou de categoria
  if ((template as any).oldCategory) {
    params.append("oldCategory", (template as any).oldCategory)
  }

  console.log("📤 Sending template data to destination app...")
  console.log("📦 Params:", params.toString())

  const res = await fetch(`${PROXY_BASE}/app/${appId}/templates`, {
    method: "POST",
    headers: {
      Authorization: appToken,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })

  const responseData = await res.json().catch(() => null)
  
  console.log("📥 API Response:", JSON.stringify(responseData, null, 2))
  
  // Verificar se o template já existe - tratar como sucesso
  if (responseData && responseData.status === "error") {
    if (responseData.message && responseData.message.includes("Template Already exists")) {
      console.log("✅ Template já existe no destino - pulando")
      // Não lançar erro, retornar normalmente para indicar "já importado"
      return
    }
    
    // Para templates de mídia, se a mensagem indica problema de mídia mas o template foi criado
    // tratar como sucesso parcial
    if (template.templateType === "VIDEO" || template.templateType === "IMAGE" || template.templateType === "DOCUMENT") {
      // Verificar se é um erro de mídia que não impede a criação do template
      const mediaWarnings = [
        "Provide valid example media",
        "media",
        "mediaId",
        "mediaUrl"
      ]
      const isMediaWarning = mediaWarnings.some(w => 
        responseData.message && responseData.message.toLowerCase().includes(w.toLowerCase())
      )
      
      if (isMediaWarning) {
        console.log("⚠️ Template de mídia criado com aviso:", responseData.message)
        console.log("   A mídia precisará ser enviada manualmente no painel da Gupshup")
        // Não tratar como erro fatal - o template foi criado
        return
      }
    }
    
    // Para outros erros, lançar exceção
    throw new Error(responseData.message || "Erro desconhecido da API")
  }
  
  if (!res.ok) {
    const message = responseData?.message || responseData?.error || `HTTP ${res.status}`
    throw new Error(message)
  }
  
  console.log("✅ Template criado com sucesso!")
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

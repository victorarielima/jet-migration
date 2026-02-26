import { NextRequest, NextResponse } from "next/server"

const GUPSHUP_CDN_DOMAINS = [
  "cdn.gupshup.io",
  "gupshup.io",
  "storage.googleapis.com",
  "filemanager.gupshup.io",
]

/**
 * Proxy para buscar mídia de templates da Gupshup
 * Aceita tanto URLs diretas quanto mediaId
 * 
 * Query params:
 * - url: URL direta da mídia (será usada com proxy para evitar CORS)
 * - mediaId: ID da mídia na Gupshup
 * - appId: ID do app (obrigatório para mediaId)
 * 
 * Headers:
 * - Authorization: Token de autenticação (opcional, usado para URLs que requerem auth)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mediaUrl = searchParams.get("url")
  const mediaId = searchParams.get("mediaId")
  const appId = searchParams.get("appId")
  const authToken = request.headers.get("Authorization")

  try {
    // Caso 1: URL direta de mídia
    if (mediaUrl) {
      console.log("🖼️ Fetching media from URL:", mediaUrl)
      
      // Verificar se é uma URL da Gupshup que pode precisar de auth
      let needsAuth = false
      try {
        const url = new URL(mediaUrl)
        needsAuth = GUPSHUP_CDN_DOMAINS.some(domain => url.hostname.includes(domain))
      } catch {
        // URL inválida, tentar mesmo assim
      }
      
      const headers: Record<string, string> = {
        // User-Agent para evitar bloqueios
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      }
      
      if (needsAuth && authToken) {
        headers["Authorization"] = authToken
      }
      
      const response = await fetch(mediaUrl, { 
        headers,
        // Seguir redirects
        redirect: "follow",
      })
      
      if (!response.ok) {
        console.log("❌ Failed to fetch media:", response.status)
        // Retornar imagem placeholder ou erro
        return NextResponse.json(
          { error: "Failed to fetch media", status: response.status },
          { status: response.status }
        )
      }
      
      const contentType = response.headers.get("Content-Type") || "application/octet-stream"
      const buffer = await response.arrayBuffer()
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400", // Cache por 24h
          "Access-Control-Allow-Origin": "*",
        },
      })
    }
    
    // Caso 2: Buscar mídia por mediaId via API da Gupshup
    if (mediaId && appId) {
      console.log("🖼️ Fetching media by ID:", mediaId, "for app:", appId)
      
      // Nota: Para buscar mídia por ID, geralmente é necessário um token de app
      // Se não temos o token, tentamos construir uma URL conhecida
      
      // Tentar URLs conhecidas da Gupshup para mídia
      const possibleUrls = [
        `https://filemanager.gupshup.io/fm/v4/media/${mediaId}`,
        `https://cdn.gupshup.io/media/${mediaId}`,
        `https://storage.googleapis.com/gupshup-media/${mediaId}`,
      ]
      
      for (const url of possibleUrls) {
        try {
          const headers: Record<string, string> = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          }
          
          if (authToken) {
            headers["Authorization"] = authToken
          }
          
          const response = await fetch(url, { headers, redirect: "follow" })
          
          if (response.ok) {
            const contentType = response.headers.get("Content-Type") || "application/octet-stream"
            
            // Se for JSON, pode conter a URL real
            if (contentType.includes("application/json")) {
              const data = await response.json()
              if (data.url || data.mediaUrl) {
                const actualUrl = data.url || data.mediaUrl
                const mediaResponse = await fetch(actualUrl, { redirect: "follow" })
                if (mediaResponse.ok) {
                  const mediaContentType = mediaResponse.headers.get("Content-Type") || "application/octet-stream"
                  const buffer = await mediaResponse.arrayBuffer()
                  return new NextResponse(buffer, {
                    status: 200,
                    headers: {
                      "Content-Type": mediaContentType,
                      "Cache-Control": "public, max-age=86400",
                      "Access-Control-Allow-Origin": "*",
                    },
                  })
                }
              }
            } else {
              // Retornar diretamente
              const buffer = await response.arrayBuffer()
              return new NextResponse(buffer, {
                status: 200,
                headers: {
                  "Content-Type": contentType,
                  "Cache-Control": "public, max-age=86400",
                  "Access-Control-Allow-Origin": "*",
                },
              })
            }
          }
        } catch (e) {
          console.log("Failed URL attempt:", url, e)
          continue
        }
      }
      
      console.log("❌ Could not find media for ID:", mediaId)
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: "Missing required parameters (url or mediaId+appId)" },
      { status: 400 }
    )
  } catch (error) {
    console.error("❌ Error fetching media:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

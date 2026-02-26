import { NextRequest, NextResponse } from "next/server"

const GUPSHUP_BASE = "https://partner.gupshup.io/partner"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const targetPath = path.join("/")
  const targetUrl = `${GUPSHUP_BASE}/${targetPath}`

  const headers: Record<string, string> = {}
  const auth = request.headers.get("Authorization")
  
  console.log("🔍 GET Request:", targetUrl)
  console.log("🔑 Authorization Header:", auth ? (typeof auth === 'string' ? `${auth.substring(0, 20)}...` : JSON.stringify(auth)) : "MISSING")
  
  if (auth) {
    headers["Authorization"] = auth
  }

  try {
    const response = await fetch(targetUrl, { headers })
    const data = await response.text()

    return new NextResponse(data, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
    })
  } catch {
    return NextResponse.json({ error: "Erro ao conectar com a API Gupshup" }, { status: 502 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const targetPath = path.join("/")
  const targetUrl = `${GUPSHUP_BASE}/${targetPath}`

  const headers: Record<string, string> = {}
  const auth = request.headers.get("Authorization")
  
  console.log("📮 POST Request:", targetUrl)
  console.log("🔑 Authorization Header:", auth ? (typeof auth === 'string' ? `${auth.substring(0, 20)}...` : JSON.stringify(auth)) : "MISSING")
  
  if (auth) {
    headers["Authorization"] = auth
  }

  const contentType = request.headers.get("Content-Type")
  if (contentType) {
    headers["Content-Type"] = contentType
  }

  try {
    const body = await request.text()
    console.log("📦 Body preview:", body.substring(0, 100) + "...")
    
    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body,
    })
    const data = await response.text()
    
    console.log("✅ Response status:", response.status)

    return new NextResponse(data, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
    })
  } catch {
    return NextResponse.json({ error: "Erro ao conectar com a API Gupshup" }, { status: 502 })
  }
}

import { SignedRequest } from '@turnkey/http'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { url, stamp, body }: SignedRequest = await request.json()

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Stamp-WebAuthn': stamp,
    },
    body,
  })
  const json = await response.json()

  return NextResponse.json(json)
}

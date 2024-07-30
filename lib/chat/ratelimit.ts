import { kv } from '@vercel/kv'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

function getIP() {
  return headers().get('x-real-ip') ?? 'unknown'
}

export async function rateLimit() {
  const ip = getIP()
  const key = `ratelimit:${ip}`
  
  const [requests, _] = await kv.pipeline()
    .incr(key)
    .expire(key, 60)
    .exec()

  if (requests > 60) {
    redirect('/waiting-room')
  }
}
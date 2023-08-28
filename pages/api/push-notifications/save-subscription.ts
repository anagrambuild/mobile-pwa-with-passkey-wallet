import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { db } from '@shared/db/drizzle'
import { users } from '@shared/db/schema'
import { eq } from 'drizzle-orm'

type TRequest = {
  subscription: PushSubscription
  subscriptionSerialized: string
}

type TResponse = {
  message: string
  subscription?: any
}

/**
 * Saves a user's WebPush subscription (https://developer.mozilla.org/en-US/docs/Web/API/PushSubscription)
 */
export default async function addSubscription(
  req: NextApiRequest,
  res: NextApiResponse<TResponse>,
) {
  const { userId } = getAuth(req)

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  let body = req.body as TRequest

  await db
    .update(users)
    .set({
      web_push_subscription: body.subscription,
    })
    .where(eq(users.external_auth_provider_user_id, userId))

  res.status(200).json({ message: 'ok', subscription: body.subscription })
}

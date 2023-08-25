import { db } from '@shared/db/drizzle'
import { users } from '@shared/db/schema'
import type { NextApiRequest, NextApiResponse } from 'next'
import webPush from 'web-push'
import { isNotNull } from 'drizzle-orm'

const Notification = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Invalid request method.')
  }
  if (
    !process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ||
    !process.env.WEB_PUSH_PRIVATE_KEY ||
    !process.env.WEB_PUSH_SUBJECT
  ) {
    throw new Error('Environment variables supplied not sufficient.')
  }
  const usersWithSubscriptions = await db
    .select()
    .from(users)
    .where(isNotNull(users.web_push_subscription))

  webPush.setVapidDetails(
    process.env.WEB_PUSH_SUBJECT,
    process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
    process.env.WEB_PUSH_PRIVATE_KEY,
  )

  for (let i = 0; i < usersWithSubscriptions.length; i++) {
    const user = usersWithSubscriptions[i]
    const subscription =
      user.web_push_subscription as any as webPush.PushSubscription

    try {
      const responseThing = await webPush.sendNotification(
        subscription,
        JSON.stringify({
          title: 'Hello Web Push',
          message: 'Sample web push notification',
        }),
      )
      console.log('responseThing', responseThing)
    } catch (e) {
      console.error('error pushing notification', e)
    }
  }

  res.status(200).json({ message: 'ok' })
}

export default Notification

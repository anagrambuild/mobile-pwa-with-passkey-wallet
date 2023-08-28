import type { NextApiRequest, NextApiResponse } from 'next'
import webPush from 'web-push'

const PushWebNotificationFromSubscriptionDemoHandler = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Invalid request method.')
  }
  if (
    !process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ||
    !process.env.WEB_PUSH_SUBJECT ||
    !process.env.WEB_PUSH_PRIVATE_KEY ||
    !process.env.WEB_PUSH_EMAIL
  ) {
    throw new Error('Environment variables supplied not sufficient.')
  }
  const { subscription } = req.body
  webPush.setVapidDetails(
    process.env.WEB_PUSH_SUBJECT,
    process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
    process.env.WEB_PUSH_PRIVATE_KEY,
  )

  try {
    const responseThing = await webPush.sendNotification(
      subscription,
      JSON.stringify({
        title: 'Hello Web Push',
        message: 'Your web push notification is here!',
      }),
    )

    res
      .writeHead(responseThing.statusCode, responseThing.headers)
      .end(responseThing.body)
  } catch (err: any) {
    console.log('err', err)
    if ('statusCode' in err) {
      res.writeHead(err.statusCode, err.headers).end(err.body)
    } else {
      console.error(err)
      res.statusCode = 500
      res.end()
    }
  }
}

export default PushWebNotificationFromSubscriptionDemoHandler

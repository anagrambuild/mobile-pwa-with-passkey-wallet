import type { NextApiRequest, NextApiResponse } from 'next'
import { TSignedRequest, TurnkeyClient } from '@turnkey/http'
import axios from 'axios'
import { TActivityResponse } from '@turnkey/http/dist/shared'
import { ApiKeyStamper } from '@turnkey/api-key-stamper'
import { TGetWhoamiResponse } from '@turnkey/http/dist/__generated__/services/coordinator/public/v1/public_api.fetcher'

type TResponse = {
  // todo
}

export default async function authenticateExisting(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  let signedRequest = req.body as TSignedRequest

  try {
    const activityResponse = await axios.post(
      signedRequest.url,
      signedRequest.body,
      {
        headers: {
          [signedRequest.stamp.stampHeaderName]:
            signedRequest.stamp.stampHeaderValue,
        },
      },
    )

    if (activityResponse.status !== 200) {
      res.status(500).json({
        message: `expected 200, got ${activityResponse.status}`,
      })
    }
    let fresponse = activityResponse.data as TGetWhoamiResponse
    res.json({
      res: fresponse,
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({
      message: `Something went wrong, caught error: ${e}`,
    })
  }
}

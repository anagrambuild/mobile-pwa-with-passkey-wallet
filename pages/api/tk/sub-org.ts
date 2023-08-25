import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { TurnkeyApiTypes, TurnkeyClient } from '@turnkey/http'
import { createActivityPoller } from '@turnkey/http/dist/async'
import { ApiKeyStamper } from '@turnkey/api-key-stamper'
import { users } from '@shared/db/schema'
import { db } from '@shared/db/drizzle'
import { eq } from 'drizzle-orm'
import { first } from 'lodash'
import { refineNonNull } from '@shared/client-utils'

type TAttestation = TurnkeyApiTypes['v1Attestation']

type CreateSubOrgRequest = {
  subOrgName: string
  challenge: string
  attestation: TAttestation
}

type CreateSubOrgResponse = {
  subOrgId: string
  addresses: Array<{ format?: any; address?: string }>
  createdAddress: { format?: any; address?: string }
  privateKeyId: string
}

type ErrorMessage = {
  message: string
}

/**
 * For a new user:
 * Creates a sub org on TurnKey for the user and it's first key pair
 * After this function runs successfully, we'll have a new secure non-custodial wallet for the user ready to use.
 * @param req
 * @param res
 * @returns
 */
export default async function createUser(
  req: NextApiRequest,
  res: NextApiResponse<CreateSubOrgResponse | ErrorMessage>,
) {
  const { userId } = getAuth(req)

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const createSubOrgRequest = req.body as CreateSubOrgRequest

  try {
    const turnkeyClient = new TurnkeyClient(
      { baseUrl: process.env.NEXT_PUBLIC_TURNKEY_API_BASE_URL! },
      new ApiKeyStamper({
        apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
        apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
      }),
    )

    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createSubOrganization,
    })

    // Create sub org on turnkey for user...
    const completedActivity = await activityPoller({
      type: 'ACTIVITY_TYPE_CREATE_SUB_ORGANIZATION_V2',
      timestampMs: String(Date.now()),
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      parameters: {
        subOrganizationName: createSubOrgRequest.subOrgName,
        rootQuorumThreshold: 1,
        rootUsers: [
          {
            userName: 'New user',
            apiKeys: [],
            authenticators: [
              {
                authenticatorName: 'Passkey',
                challenge: createSubOrgRequest.challenge,
                attestation: createSubOrgRequest.attestation,
              },
            ],
          },
          {
            userName: 'onboarding-helper',
            userEmail: 'onboarding-helper@anagram.xyz',
            authenticators: [],
            apiKeys: [
              {
                apiKeyName: process.env.TURNKEY_BACKEND_API_KEY_NAME!,
                publicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
              },
            ],
          },
        ],
      },
    })

    const subOrgId = refineNonNull(
      completedActivity.result.createSubOrganizationResult?.subOrganizationId,
    )

    const activityPollerForCreatePrivateKeys = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createPrivateKeys,
    })

    // Ask turnkey to create a new public/private key for the user...
    const createKeyPairForSubOrg = await activityPollerForCreatePrivateKeys({
      type: 'ACTIVITY_TYPE_CREATE_PRIVATE_KEYS_V2',
      organizationId: subOrgId,
      timestampMs: String(Date.now()),
      parameters: {
        privateKeys: [
          {
            privateKeyName: `ETH Key ${Math.floor(Math.random() * 1000)}`,
            curve: 'CURVE_SECP256K1',
            addressFormats: ['ADDRESS_FORMAT_ETHEREUM'],
            privateKeyTags: [],
          },
        ],
      },
    })

    const createSubOrgKeyPairResult = first(
      createKeyPairForSubOrg.result.createPrivateKeysResultV2?.privateKeys,
    )

    const addresses = refineNonNull(createSubOrgKeyPairResult?.addresses)
    // On initial suborg bootstrap, this is always the first key
    const createdAddress = refineNonNull(first(addresses))
    // Get the private key id (not the private key itself) to save to database.
    // We use this private key id on the TurnKey API to request and sign transactions
    const privateKeyId = refineNonNull(createSubOrgKeyPairResult?.privateKeyId)

    await db
      .update(users)
      .set({
        turnkey_suborg: subOrgId,
        turnkey_private_key_id: privateKeyId,
        turnkey_private_key_public_address: createdAddress?.address,
      })
      .where(eq(users.external_auth_provider_user_id, userId))

    res.status(200).json({
      subOrgId,
      createdAddress,
      addresses: addresses,
      privateKeyId: privateKeyId,
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({
      message: 'Something went wrong.',
    })
  }
}

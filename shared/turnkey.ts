import { getWebAuthnAttestation, TSignedRequest } from '@turnkey/http'
import { base64UrlEncode, generateRandomBuffer } from './client-utils'
import axios from 'axios'

export type Registration = {
  subOrganizationId: string
  privateKeyId: string
  publicKey: string
}

export async function proxy<T>(signedRequest: TSignedRequest): Promise<T> {
  const response = await fetch('/api/turnkey/proxy', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(signedRequest),
  })
  return await response.json()
}

export const attestUserAndCreateSubOrg = async (args: {
  subOrgName: string
  passKeyIdName: string
}) => {
  const { subOrgName, passKeyIdName } = args
  const challenge = generateRandomBuffer()
  const authenticatorUserId = generateRandomBuffer()

  const attestation = await getWebAuthnAttestation({
    publicKey: {
      attestation: 'none',
      authenticatorSelection: {
        requireResidentKey: true,
        residentKey: 'required',
        userVerification: 'preferred',
      },
      excludeCredentials: [],
      extensions: {
        credProps: true,
      },
      rp: {
        id: global.location?.hostname,
        name: passKeyIdName,
      },
      challenge,
      pubKeyCredParams: [
        {
          type: 'public-key',
          // All algorithms can be found here: https://www.iana.org/assignments/cose/cose.xhtml#algorithms
          // Turnkey only supports ES256 at the moment.
          alg: -7,
        },
      ],
      user: {
        id: authenticatorUserId,
        name: subOrgName,
        displayName: subOrgName,
      },
    },
  })

  // Proxy signed attestation request to backend to create suborg
  const res = await axios.post('/api/tk/sub-org', {
    subOrgName: subOrgName,
    attestation,
    challenge: base64UrlEncode(challenge),
  })

  return res.data.subOrgId
}

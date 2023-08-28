import { useAuth } from '@clerk/nextjs'
import { User } from '@shared/db/schema'
import { useMutation, useQuery } from '@tanstack/react-query'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { Bell, Coins, Home } from 'lucide-react'
import {
  Page,
  Navbar,
  Block,
  Button,
  BlockTitle,
  Preloader,
  TabbarLink,
  Icon,
  Tabbar,
  DialogButton,
  Dialog,
} from 'konsta/react'
import { MouseEventHandler, use, useEffect, useState } from 'react'
import { attestUserAndCreateSubOrg } from '@shared/turnkey'
import { createAccount } from '@turnkey/viem'
import { createWalletClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { WebauthnStamper } from '@turnkey/webauthn-stamper'
import { TurnkeyClient } from '@turnkey/http'
import axios from 'axios'
import { base64ToUint8Array, truncateEthAddress } from '@shared/client-utils'
import { useInstallWebhookAndOfferUserUpgradeIfAvailable } from '../hooks/useInstallWebhookAndPromptUserUpgradeIfAvailable'
import { useDetectRuntimeEnvironment } from '../hooks/useDetectRuntimeEnvironment'

type subOrgFormData = {
  subOrgName: string
}

type privateKeyFormData = {
  privateKeyName: string
}

type signingFormData = {
  messageToSign: string
}

const stamper = new WebauthnStamper({
  rpId: global.location?.hostname,
})

const passkeyHttpClient = new TurnkeyClient(
  {
    baseUrl: process.env.NEXT_PUBLIC_TURNKEY_API_BASE_URL!,
  },
  stamper,
)

export default function Index() {
  const isSWInstalled = useInstallWebhookAndOfferUserUpgradeIfAvailable()
  const web2Auth = useAuth()

  const userDataQuery = useQuery({
    queryKey: ['whoami', web2Auth.userId],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
    queryFn: async () => {
      const res = await fetch('/api/auth/me')
      const json = await res.json()
      return json
    },
  })

  const handleSignoutClick = async () => {
    await web2Auth.signOut()
  }

  const user: User | undefined = userDataQuery.data?.user
  const isRegistered = user?.internal_id ? true : false

  const hasRegisteredWallet = !!user?.turnkey_suborg

  const isLoadingDataToDeriveUi =
    userDataQuery.isLoading || web2Auth.isLoaded === false

  const envMode = useDetectRuntimeEnvironment()

  let onboardingStatus:
    | 'loading'
    | 'not-mobile'
    | 'mobile-not-pwa'
    | 'pwa-not-logged-in'
    | 'pwa-logged-in-no-wallet'
    | 'pwa-logged-in-has-wallet' = 'loading'
  if (isLoadingDataToDeriveUi) {
    onboardingStatus = 'loading'
  } else if (envMode === 'not-mobile') {
    onboardingStatus = 'not-mobile'
  } else if (envMode === 'mobile-not-installed') {
    onboardingStatus = 'mobile-not-pwa'
  } else if (envMode === 'pwa' && isRegistered === false) {
    onboardingStatus = 'pwa-not-logged-in'
  } else if (
    envMode === 'pwa' &&
    isRegistered === true &&
    hasRegisteredWallet === false
  ) {
    onboardingStatus = 'pwa-logged-in-no-wallet'
  } else if (
    envMode === 'pwa' &&
    isRegistered === true &&
    hasRegisteredWallet === true
  ) {
    onboardingStatus = 'pwa-logged-in-has-wallet'
  }

  const [activeTab, setActiveTab] = useState<'home' | 'feed' | 'airdrop'>(
    'home',
  )
  const isTabbarIcons = true
  const isTabbarLabels = false

  const createSubOrgMutation = useMutation({
    mutationFn: async () => {
      const subOrgId = await attestUserAndCreateSubOrg({
        passKeyIdName: 'Anagram PWA Demo 4',
        subOrgName: 'Anagram PWA Demo 4',
      })
      await userDataQuery.refetch()
      return subOrgId
    },
  })

  const handleCreateSubOrgClick = async () => {
    const subOrgId = await createSubOrgMutation.mutateAsync()
  }

  const signMessage = async (
    data: signingFormData,
    subOrgId: string,
    privateKeyId: string,
    privateKeyPublicAddress: string,
  ) => {
    if (!subOrgId || !privateKeyId || !privateKeyPublicAddress) {
      throw new Error('sub-org id or private key not found')
    }
    const viemAccount = await createAccount({
      client: passkeyHttpClient,
      organizationId: subOrgId,
      privateKeyId: privateKeyId,
      ethereumAddress: privateKeyPublicAddress,
    })

    const viemClient = createWalletClient({
      account: viemAccount,
      chain: sepolia,
      transport: http(),
    })

    const signedMessage = await viemClient.signMessage({
      message: data.messageToSign,
    })

    return {
      message: data.messageToSign,
      signature: signedMessage,
    }
  }

  const handleSignMessageClick = async () => {
    const res = await signMessage(
      { messageToSign: 'Hello from PWA' },
      user?.turnkey_suborg!,
      user?.turnkey_private_key_id!,
      user?.turnkey_private_key_public_address!,
    )

    setTimeout(() => {
      alert(`${res.message} - ${res.signature}`)
    })
  }

  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null)
  const [swSubscription, setSwSubscription] = useState<PushSubscription | null>(
    null,
  )
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.workbox !== undefined
    ) {
      // run only in browser
      navigator.serviceWorker.ready.then((reg) => {
        console.log('reg1', reg, reg.pushManager)
        reg?.pushManager?.getSubscription().then((sub) => {
          if (
            sub &&
            !(
              sub.expirationTime &&
              Date.now() > sub.expirationTime - 5 * 60 * 1000
            )
          ) {
            setSwSubscription(sub)
          }
        })
        setSwRegistration(reg)
      })
    }
  }, [isSWInstalled])

  const [alertEnabledNotifsOpen, setAlertEnabledNotifsOpen] = useState(false)

  const handleClickEnableNotifications: MouseEventHandler<
    HTMLButtonElement
  > = async (event) => {
    if (!process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY) {
      throw new Error('Environment variables supplied not sufficient.')
    }
    if (!swRegistration) {
      console.error('No SW registration available.')
      return
    }
    event.preventDefault()
    const sub = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(
        process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
      ),
    })
    await axios.post(
      '/api/push-notifications/save-subscription',
      {
        subscription: sub,
        subscriptionSerialized: JSON.stringify(sub),
      },
      { withCredentials: true },
    )
    await userDataQuery.refetch()
    setAlertEnabledNotifsOpen(true)
  }

  const handleClickDisableNotifications: MouseEventHandler<
    HTMLButtonElement
  > = async (event) => {
    // TODO
    // if (!process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY) {
    //   throw new Error('Environment variables supplied not sufficient.')
    // }
    // if (!swRegistration) {
    //   console.error('No SW registration available.')
    //   return
    // }
    // event.preventDefault()
    // const unsubscribed = await swSubscription?.unsubscribe()
    // await axios.post(
    //   '/api/auth/remove-subscription',
    //   {
    //     subscriptionEndpoint: swSubscription?.endpoint,
    //   },
    //   { withCredentials: true },
    // )
    // await meQuery.refetch()
  }

  return (
    <>
      <Head>
        <title>PWAWallet | Welcome</title>
      </Head>

      {/* Loading... */}
      {onboardingStatus === 'loading' && (
        <Page
          colors={{
            bgIos: '#FEFEFE',
          }}
          className="flex flex-1 flex-col items-center justify-center"
        >
          <Preloader />
        </Page>
      )}

      {/* Not mobile (desktop) - Come back on mobile */}
      {onboardingStatus === 'not-mobile' && (
        <Page
          colors={{
            bgIos: '#FEFEFE',
          }}
          className="flex flex-1 flex-col items-center justify-center"
        >
          <div>Not mobile</div>
          <div>Please visit site on your mobile device</div>
        </Page>
      )}

      {/* Mobile but not PWA - Come back on mobile */}
      {onboardingStatus === 'mobile-not-pwa' && (
        <Page
          colors={{
            bgIos: '#FEFEFE',
          }}
          className="flex flex-1 flex-col items-center justify-center"
        >
          <div>Mobile detected, but not PWA.</div>
          <div>Please install PWA</div>
        </Page>
      )}

      {/* User needs to register/login */}
      {onboardingStatus === 'pwa-not-logged-in' && (
        <Page
          colors={{
            bgIos: '#FEFEFE',
          }}
        >
          <div className="flex flex-col flex-1 h-full justify-between">
            {/* Top of page */}
            <div className="p-8 pt-32 space-y-4">
              <div className="flex items-center justify-center">
                <Image
                  alt={''}
                  src={'/images/wallet-icon-2.png'}
                  width={164}
                  height={164}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold flex justify-center items-center">
                  PWA with wallet
                </h1>
              </div>
            </div>
            {/* Bottom of page */}
            <div className="p-8 pb-16 flex flex-col justify-end space-y-2">
              <Link href={'/sign-in'}>
                <Button rounded large>
                  Sign In
                </Button>
              </Link>
              {isRegistered && (
                <Button outline onClick={handleSignoutClick} rounded large>
                  Sign Out
                </Button>
              )}
            </div>
          </div>
        </Page>
      )}

      {/* User logged in but needs to create wallet */}
      {onboardingStatus === 'pwa-logged-in-no-wallet' && (
        <Page
          colors={{
            bgIos: '#FEFEFE',
          }}
        >
          <div className="flex flex-col flex-1 h-full justify-between">
            {/* TOP */}
            <div className="p-8 pt-32 space-y-4">
              <div className="flex items-center justify-center">
                <Image
                  alt={''}
                  src={'/images/wallet-icon-2.png'}
                  width={164}
                  height={164}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold flex justify-center items-center">
                  Create a wallet
                </h1>
              </div>
            </div>
            {/* Bottom */}
            <div className="p-8 pb-16 flex flex-col justify-end space-y-4">
              <Button
                disabled={createSubOrgMutation.isLoading}
                onClick={handleCreateSubOrgClick}
                rounded
                large
              >
                {createSubOrgMutation.isLoading ? 'Creating' : 'Create'} wallet
              </Button>
              {
                <Button clear large rounded onClick={handleSignoutClick}>
                  Sign Out
                </Button>
              }
            </div>
          </div>
        </Page>
      )}

      {/* User is logged in and has wallet -- happy path, now user can start using application */}
      {onboardingStatus === 'pwa-logged-in-has-wallet' && (
        <Page
          colors={{
            bgIos: '#FEFEFE',
          }}
        >
          <Navbar
            title="Home"
            subtitle="Wallet ready to use"
            className="top-0 sticky"
            large
            transparent={true}
          />

          <Tabbar
            labels={isTabbarLabels}
            icons={isTabbarIcons}
            className="left-0 bottom-0 fixed"
          >
            <TabbarLink
              active={activeTab === 'home'}
              onClick={() => setActiveTab('home')}
              icon={
                isTabbarIcons && <Icon ios={<Home className="w-7 h-7" />} />
              }
              label={isTabbarLabels && 'Home'}
            />
            <TabbarLink
              active={activeTab === 'feed'}
              onClick={() => setActiveTab('feed')}
              icon={
                isTabbarIcons && <Icon ios={<Bell className="w-7 h-7" />} />
              }
              label={isTabbarLabels && 'Feed'}
            />
            <TabbarLink
              active={activeTab === 'airdrop'}
              onClick={() => setActiveTab('airdrop')}
              icon={
                isTabbarIcons && <Icon ios={<Coins className="w-7 h-7" />} />
              }
              label={isTabbarLabels && 'Airdrop'}
            />
          </Tabbar>
          {activeTab === 'home' && (
            <>
              <BlockTitle>
                {truncateEthAddress(
                  user?.turnkey_private_key_public_address ?? undefined,
                )}
              </BlockTitle>
              <Block>
                <p>Balance: 0.00 ETH</p>
              </Block>
              <Block strong inset className="space-y-4">
                {!user?.web_push_subscription && (
                  <Button
                    onClick={handleClickEnableNotifications}
                    rounded
                    large
                  >
                    Enable notifications
                  </Button>
                )}
                {!!user?.web_push_subscription && (
                  <Button
                    disabled
                    onClick={handleClickEnableNotifications}
                    rounded
                    large
                  >
                    Notifications enabled
                  </Button>
                )}
                <Dialog
                  opened={alertEnabledNotifsOpen}
                  onBackdropClick={() => setAlertEnabledNotifsOpen(false)}
                  title="Noticiations enabled"
                  content="Notifications are now enabled!"
                  buttons={
                    <DialogButton
                      onClick={() => setAlertEnabledNotifsOpen(false)}
                    >
                      Ok
                    </DialogButton>
                  }
                />
                <Button onClick={handleSignMessageClick} rounded large>
                  Sign Message
                </Button>

                <Button onClick={handleSignMessageClick} rounded large>
                  Swap 1 USDC to ETH
                </Button>
                <Button clear onClick={handleSignoutClick} rounded large>
                  Sign Out
                </Button>
                <p>
                  <b>Tab 1</b>
                </p>
                <p>
                  <span>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                    Alias accusantium necessitatibus, nihil quas praesentium at
                    quibusdam cupiditate possimus et repudiandae dolorum
                    delectus quo, similique voluptatem magni explicabo adipisci
                    magnam ratione!
                  </span>
                </p>
              </Block>
            </>
          )}
          {activeTab === 'feed' && (
            <Block strong inset className="space-y-4">
              <p>
                <b>Tab 2</b>
              </p>
              <p>
                <span>
                  Dicta beatae repudiandae ab pariatur mollitia praesentium fuga
                  ipsum adipisci, quia nam expedita, est dolore eveniet, dolorum
                  obcaecati? Veniam repellendus mollitia sapiente minus saepe
                  voluptatibus necessitatibus laboriosam incidunt nihil autem.
                </span>
              </p>
            </Block>
          )}
          {activeTab === 'airdrop' && (
            <Block strong inset className="space-y-4">
              <p>
                <b>Tab 3</b>
              </p>
              <p>
                <span>
                  Vero esse ab natus neque commodi aut quidem nobis. Unde, quam
                  asperiores. A labore quod commodi autem explicabo distinctio
                  saepe ex amet iste recusandae porro consectetur, sed dolorum
                  sapiente voluptatibus?
                </span>
                <span>
                  Commodi ipsum, voluptatem obcaecati voluptatibus illum hic
                  aliquam veritatis modi natus unde, assumenda expedita, esse
                  eum fugit? Saepe aliquam ipsam illum nihil facilis, laborum
                  quia, eius ea dolores molestias dicta.
                </span>
                <span>
                  Consequatur quam laudantium, magnam facere ducimus tempora
                  temporibus omnis cupiditate obcaecati tempore? Odit qui a,
                  voluptas eveniet similique, doloribus eum dolorum ad, enim ea
                  itaque voluptates porro minima. Omnis, magnam.
                </span>
                <span>
                  Debitis, delectus! Eligendi excepturi rem veritatis, ad
                  exercitationem tempore eveniet voluptates aut labore harum
                  dolorem nemo repellendus accusantium quibusdam neque? Itaque
                  iusto quisquam reprehenderit aperiam maiores dicta iure
                  necessitatibus est.
                </span>
              </p>
            </Block>
          )}
        </Page>
      )}
    </>
  )
}

import { SignIn } from '@clerk/nextjs'
import { Navbar, NavbarBackLink, Page } from 'konsta/react'
import { useRouter } from 'next/router'

export default function SignInPage() {
  const router = useRouter()

  const backLink = true
  return (
    <Page
      colors={{
        bgIos: '#FEFEFE',
      }}
    >
      <Navbar
        colors={{
          bgIos: '#FEFEFE',
        }}
        title="Sign In"
        left={backLink && <NavbarBackLink onClick={() => router.back()} />}
      />
      <div className="flex flex-1 justify-center">
        <SignIn
          appearance={{
            elements: {
              headerTitle: {
                display: 'none',
              },
              headerSubtitle: {
                display: 'none',
              },
              card: {
                boxShadow: 'none',
                backgroundColor: 'transparent',
              },
            },
            layout: {
              logoPlacement: 'none',
              showOptionalFields: false,
              shimmer: true,
            },
          }}
        />
      </div>
    </Page>
  )
}

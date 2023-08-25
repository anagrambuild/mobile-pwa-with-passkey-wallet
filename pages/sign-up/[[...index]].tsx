import { SignUp } from '@clerk/nextjs'
import { Navbar, NavbarBackLink, Page } from 'konsta/react'
import { useRouter } from 'next/router'

export default function SignInPage() {
  const router = useRouter()

  const backLink = true
  return (
    <Page>
      <Navbar
        title="Sign Up"
        left={backLink && <NavbarBackLink onClick={() => router.back()} />}
      />
      <div className="flex flex-1 justify-center">
        <SignUp
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

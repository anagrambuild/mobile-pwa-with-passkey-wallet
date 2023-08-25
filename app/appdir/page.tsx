import { UserButton } from '@clerk/nextjs'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Home (appDir)',
}

export default function Page() {
  return (
    <>
      <UserButton afterSignOutUrl="/" />
      <h1>PWA on app directory</h1>
      <Link href="/appdir/about">About page</Link>
    </>
  )
}

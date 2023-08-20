import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home (appDir)",
};

export default function Page() {
  return (
    <>
      <h1>Next.js + PWA = AWESOME!</h1>
      <Link href="/appdir/about">About page</Link>
    </>
  );
}

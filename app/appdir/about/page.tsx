import Link from "next/link";

import { Button } from "./Button";

export default function Page() {
  return (
    <>
      <h1>This is the basic example.</h1>
      <Link href="/appdir">Home page</Link>
      <Button />
    </>
  );
}

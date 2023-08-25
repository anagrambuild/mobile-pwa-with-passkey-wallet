import axios from 'axios'
import { Button, Navbar, Page } from 'konsta/react'

const CommandPage = () => {
  return (
    <Page
      colors={{
        bgIos: '#FEFEFE',
      }}
    >
      <Navbar title="Admin" className="top-0 sticky" large transparent={true} />

      <Button
        onClick={async () => {
          const response = await axios.post(
            '/api/push-notifications/push-all',
            {},
            { withCredentials: true },
          )
        }}
      >
        Trigger push notification for everyone
      </Button>
    </Page>
  )
}

export default CommandPage

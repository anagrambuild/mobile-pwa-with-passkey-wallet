declare const self: ServiceWorkerGlobalScope
import { util } from '../shared/worker-utils'
import { PwaOnDevicePersistentDB, demoIndexedDbWrite } from './db'

// To disable all Workbox logging during development, you can set self.__WB_DISABLE_DEV_LOGS to true
// https://developer.chrome.com/docs/workbox/troubleshooting-and-logging/#turn-off-logging-in-development-builds-in-any-workflow
// self.__WB_DISABLE_DEV_LOGS = true

// listen to message event from window
self.addEventListener('message', (event) => {
  // noop
})

self.addEventListener('push', async (event) => {
  // await demoIndexedDbWrite()
  const data = JSON.parse(event.data?.text() ?? '{ title: "" }')
  event?.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.message,
      icon: '/icons/android-chrome-192x192.png',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event?.notification.close()
  event?.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        if (clientList.length > 0) {
          let client = clientList[0]
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i]
            }
          }
          return client.focus()
        }
        return self.clients.openWindow('/')
      }),
  )
})

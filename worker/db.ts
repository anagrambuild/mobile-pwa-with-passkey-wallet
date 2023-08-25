import { openDB, DBSchema } from 'idb'

export interface PwaOnDevicePersistentDB extends DBSchema {
  'test-object': {
    key: string
    value: number
  }
  products: {
    value: {
      name: string
      price: number
      productCode: string
    }
    key: string
    indexes: { 'by-price': number }
  }
}

export async function demoIndexedDbWrite() {
  const db = await openDB<PwaOnDevicePersistentDB>('my-db', 1, {
    upgrade(db: any) {
      db.createObjectStore('test-object')

      const productStore = db.createObjectStore('products', {
        keyPath: 'productCode',
      })
      productStore.createIndex('by-price', 'price')
    },
  })
  // This works
  await db.put('test-object', 7, 'Jen')
}

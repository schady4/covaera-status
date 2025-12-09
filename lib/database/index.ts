import mongoose from 'mongoose'

const MONGODB_URI = process.env.STATUS_MONGODB_URI

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseStatusCache: MongooseCache | undefined
}

const cached: MongooseCache = global.mongooseStatusCache ?? { conn: null, promise: null }

if (!global.mongooseStatusCache) {
  global.mongooseStatusCache = cached
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error('Please define the STATUS_MONGODB_URI environment variable')
  }

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Connected to MongoDB (Status Database)')
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect()
    cached.conn = null
    cached.promise = null
  }
}

export async function checkDatabaseHealth(): Promise<{
  connected: boolean
  readyState: number
  latency?: number
}> {
  const start = Date.now()

  try {
    if (!cached.conn || mongoose.connection.readyState !== 1) {
      await connectToDatabase()
    }

    // Ping the database
    await mongoose.connection.db?.admin().ping()
    const latency = Date.now() - start

    return {
      connected: true,
      readyState: mongoose.connection.readyState,
      latency,
    }
  } catch (error) {
    return {
      connected: false,
      readyState: mongoose.connection.readyState,
    }
  }
}

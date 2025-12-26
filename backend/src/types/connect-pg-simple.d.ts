declare module 'connect-pg-simple' {
  import type { Store } from 'express-session'

  interface PgStoreOptions {
    conString?: string
    tableName?: string
    createTableIfMissing?: boolean
  }

  function connectPgSimple(
    // eslint-disable-next-line no-unused-vars
    session: { Store: typeof Store }
  ): new (
    // eslint-disable-next-line no-unused-vars
    options: PgStoreOptions
  ) => Store

  export default connectPgSimple
}

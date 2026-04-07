import snowflake from "snowflake-sdk"

snowflake.configure({ logLevel: "ERROR" })

function createConnection() {
  return snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT!,
    username: process.env.SNOWFLAKE_USERNAME!,
    password: process.env.SNOWFLAKE_PASSWORD!,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
  })
}

export function querySnowflake<T = Record<string, unknown>>(
  sql: string,
  binds: unknown[] = []
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const conn = createConnection()

    conn.connect((err) => {
      if (err) return reject(new Error(`Snowflake 연결 실패: ${err.message}`))

      conn.execute({
        sqlText: sql,
        binds: binds as snowflake.Binds,
        complete(execErr, _stmt, rows) {
          conn.destroy(() => {})
          if (execErr) return reject(new Error(`쿼리 실패: ${execErr.message}`))
          resolve((rows ?? []) as T[])
        },
      })
    })
  })
}
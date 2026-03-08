import { config } from 'dotenv'
import mysql from 'mysql2/promise'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// 必须在此处加载 .env，不能依赖 index.ts。
// 原因：ES Modules 的 import 是静态提升的，db.ts 在被导入时立即执行（早于 index.ts 的 config() 调用），
// 若不在此处加载，createPool() 会以空密码初始化，导致 "Access denied" 报错。
const currentDir = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(currentDir, '../../.env'), override: false })

/**
 * MySQL 连接池。
 * 环境变量在此模块顶层加载，确保连接池初始化时密码已就绪。
 */
export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'ai_dnd_local',
  connectionLimit: 10,
  namedPlaceholders: true,
})

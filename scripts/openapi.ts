import 'reflect-metadata'
import { writeFileSync } from 'node:fs'
import { criarApp, contrato } from '../src/bootstrap'

async function main() {
  process.loadEnvFile('.env')
  const app = await criarApp()
  writeFileSync('openapi.json', JSON.stringify(contrato(app), null, 2))
  await app.close()
}
void main()

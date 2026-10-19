import { criarApp } from './bootstrap'

async function bootstrap(): Promise<void> {
  const app = await criarApp()
  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()

import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { handleAIAssistantApi } from './server/aiAssistantHandler.ts'

function aiAssistantApiPlugin(): Plugin {
  return {
    name: 'smartcrop-ai-assistant-api',
    configureServer(server) {
      server.middlewares.use('/api/ai-assistant', (req, res) => {
        handleAIAssistantApi(req, res)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/ai-assistant', (req, res) => {
        handleAIAssistantApi(req, res)
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), aiAssistantApiPlugin()],
})

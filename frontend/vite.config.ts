/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Fixed Cognito settings so tests never depend on a developer's .env
    env: {
      VITE_COGNITO_AUTHORITY: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
      VITE_COGNITO_CLIENT_ID: 'test-client-id',
      VITE_COGNITO_DOMAIN: 'https://test.auth.us-east-1.amazoncognito.com',
      VITE_COGNITO_LOGOUT_URI: 'http://localhost:3000/',
      VITE_API_BASE_URL: 'https://api.test',
    },
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}'],
    },
  },
})

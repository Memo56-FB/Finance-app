// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Money, PreferencesProvider, Text } from './client'
import { en, es } from './index'
describe('request values reach server and client UI', () => {
  for (const language of ['en','es'] as const) {
    it(`${language} uses identical values`, () => {
      const messages=language==='es'?es:en
      const ui=<PreferencesProvider preferences={{language}} messages={messages}><h1><Text id="Budgets" /></h1><p><Money value={1000} /></p></PreferencesProvider>
      expect(renderToString(ui)).toContain(messages.Budgets)
      render(ui)
      expect(screen.getByRole('heading')).toHaveTextContent(messages.Budgets)
      expect(screen.getByText('$1,000.00', { exact: true })).toBeInTheDocument()
    })
  }
})

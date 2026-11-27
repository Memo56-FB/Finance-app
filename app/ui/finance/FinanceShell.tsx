import { SessionControls } from '@/lib/auth/SessionControls'
import { Sidebar } from '@/components/ui/Sidebar'
import { PreferencesBar } from '@/lib/i18n/PreferencesBar'

export function FinanceShell({ kind, children }: { kind: 'account' | 'guest'; children: React.ReactNode }) {
  return (
    <div className='grid grid-rows-[1fr_auto] lg:flex h-full w-full'>
      <div className='lg:flex-none row-start-2'>
        <Sidebar />
      </div>
      <div data-finance-scroll className='min-h-0 min-w-0 overflow-auto lg:flex-1'>
        <div className="flex items-start justify-between gap-200">
          <SessionControls access={{ kind }} />
          <PreferencesBar />
        </div>
        <main className='flex flex-col gap-400 py-300 md:py-400 px-200 md:px-500'>
          {children}
        </main>
      </div>
    </div>
  )
}

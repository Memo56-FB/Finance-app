'use client'

import { ToastContainer } from 'react-toastify'
import { XCircle } from '@phosphor-icons/react/dist/ssr'
import { useI18n } from '@/lib/i18n/client'

export function Notifications() {
  const {t}=useI18n()
  return <ToastContainer position="top-right" autoClose={8000} role="status" aria-label={t('Notifications')}
    className="md:max-lg:!left-[var(--toastify-toast-left)] md:max-lg:!right-auto lg:!top-auto lg:!bottom-[var(--toastify-toast-bottom)]"
    toastClassName="text-preset-4 !rounded-xl !font-[inherit]"
    closeButton={({closeToast})=><button type="button" aria-label={t('Close')} onClick={closeToast} className="Toastify__close-button text-grey-500"><XCircle size={20}/></button>}/>
}

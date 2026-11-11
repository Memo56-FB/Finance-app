import { Text } from '@/lib/i18n/client'
import { PreferencesBar } from '@/lib/i18n/PreferencesBar'

import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/ui/Sidebar";
import { ArrowsDownUp, ChartDonut, House, Receipt, TipJar } from "@phosphor-icons/react";

export default function Home() {
  return (
    <>
      <div className="lg:absolute lg:right-0 lg:top-0 lg:z-10"><PreferencesBar /></div>
      <p><Text id="ola" /></p>
    </>
  );
}

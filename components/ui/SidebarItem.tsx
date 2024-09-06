import Link from "next/link"
import clsx from "clsx"
import { SidebarItemProps } from "@/types/SidebarItem"

const SidebarItem = ({ href, icon: Icon, active, title }: SidebarItemProps) => {
  return (
    <Link
      href={href}
      className={clsx(
        "text-preset-5-bold lg:text-preset-3 transition-colors items-center relative",
        "flex flex-col gap-50 pt-100 pb-150 px-250 md:px-200 justify-center lg:flex-row lg:gap-200 lg:py-200 lg:px-400",
        {
          'text-grey-900 bg-beige-100 rounded-t-xl lg:rounded-r-xl before:content-[""] before:h-1 before:w-full before:bottom-0 lg:before:w-1 lg:before:h-full before:bg-green before:absolute lg:before:left-0': active
        },
        {
          'text-grey-300 bg-grey-900 hover:text-white': !active
        }
      )}
    >
      <Icon weight="fill" size={24} className={clsx(
        {
          'text-green': active
        }
      )}/>
      <p className="hidden md:block">
        {title}
      </p>
    </Link>
  )
}

export default SidebarItem
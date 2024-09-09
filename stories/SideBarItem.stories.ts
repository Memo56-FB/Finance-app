import SidebarItem from "@/components/ui/SidebarItem";
import { House } from "@phosphor-icons/react";
import { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof SidebarItem> = {
  component: SidebarItem,
  title: "Finance/Sidebar/NavLink",
  parameters: {
    layout: "centered"
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: false,
      description: 'Icon component from Phosphor Icons',
    },
    active: {
      control: false,
    }
  }
}

export default meta

type Story = StoryObj<typeof SidebarItem>

export const Navlink: Story = {
  args: {
    href: "/",
    icon: House,
    title: "Placeholder"
  }
}

export const NavlinkActive: Story = {
  args: {
    ...Navlink.args,
    active: true,
  }
}
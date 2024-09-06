import { Sidebar } from "@/components/ui/Sidebar";
import { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Sidebar> = {
  component: Sidebar,
  title: 'Finance/Sidebar',
  parameters: {
    layout: 'fullscreen'
  }
}

export default meta

type Story = StoryObj<typeof Sidebar>

export const SideBar: Story = {
  args: {
  }
}
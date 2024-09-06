import MinimizeMenu from "@/components/ui/MinimizeMenu";
import { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof MinimizeMenu> = {
  component: MinimizeMenu,
  title: "Finance/SidebarItem",
  parameters: {
    layout: "centered"
  },
}

export default meta;

type Story = StoryObj<typeof MinimizeMenu>

export const MinimizeMenuStory: Story = {
  args: {
    onClick: () => console.log('Minimize Menu')
  }
}
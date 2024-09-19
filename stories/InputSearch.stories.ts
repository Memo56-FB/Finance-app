import { InputSearch } from "@/components/ui/InputSearch";
import { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  component: InputSearch,
  title: "Finance/Fields/InputSearch",
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof InputSearch>

export const InputSearchStory: Story = {
  args: {
    placeholder: 'Search'
  }
}
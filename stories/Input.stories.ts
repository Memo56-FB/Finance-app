import { Input } from "@/components/ui/input";
import { Meta, StoryObj } from "@storybook/react";


const meta: Meta = {
  component: Input,
  title: "Finance/Fields",
  parameters: {
    layout: 'centered',
  },
}

export default meta

type Story = StoryObj<typeof Input>

export const BasicInput: Story = {
  args: {
    placeholder: 'Placeholder'
  }
}
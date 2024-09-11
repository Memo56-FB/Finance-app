import { InputPassword } from "@/components/ui/InputPassword";
import { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  component: InputPassword,
  title: "Finance/Fields/InputPassword",
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof InputPassword>
/**
 * Extension of the Input component that allows the user to toggle the visibility of the password and doesn't need type prop
 */
export const InputPasswordStory: Story = {
  args: {
    placeholder: 'Password',
  }
}
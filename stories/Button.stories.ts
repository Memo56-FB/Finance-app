import { Button } from '@/components/ui/button'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

const meta = {
  title: 'Finance/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {control: false}
  },
  args: { onClick: fn() },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: 'Placeholder',
    variant: "primary",
    disabled: false,
  },
}
export const Secondary: Story = {
  args: {
    ...Primary.args,
    variant: "secondary",
  },
}
export const Tertiary: Story = {
  args: {
    ...Primary.args,
    variant: "tertiary",
  },
}
export const Destroy: Story = {
  args: {
    ...Primary.args,
    variant: "destroy",
  },
}

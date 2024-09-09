import { Select } from "@/components/ui/select";
import { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Finance/Select",
  component: Select,
  // subcomponents: { SelectGroup, SelectValue, SelectTrigger, SelectScrollUpButton, SelectScrollDownButton },
  argTypes: {
    children: { control: false },
    className: { control: false },
  },
};

export default meta

type Story = StoryObj<typeof Select>

export const Basic: Story = {
  args: {
  }
}
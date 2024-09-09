import { SelectColorTag } from "@/components/ui/SelectColorTag";
import { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Finance/Fields",
  parameters: {
    layout: 'centered',
  },
  component: SelectColorTag,
  argTypes: {
    children: { control: false },
    className: { control: false },
  },
};

export default meta

type Story = StoryObj<typeof SelectColorTag>

export const ColorTag: Story = {
  args: {
    options: [
      {
        value: 'green',
        label: 'Green',
      },
      {
        value: 'red',
        label: 'Red',
      },
      {
        value: 'blue',
        label: 'Blue',
      },
      {
        value: 'yellow',
        label: 'Yellow',
      },
      {
        value: 'purple',
        label: 'Purple',
      },
    ]
  }
}

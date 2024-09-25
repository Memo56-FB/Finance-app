import { Meta, StoryObj } from "@storybook/react";
import { ResponsiveSelect } from "@/components/ui/ResponsiveSelect";

const meta: Meta = {
  component: ResponsiveSelect,
  title: "Finance/Fields/ResponsiveSelect",
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    children: {
      control: false,
      description: 'Icon component from Phosphor Icons',
      table: {
        type: {
          summary: 'React.ReactNode',
        },
      },
    }
  },
  tags: ['autodocs'],
}

export default meta;

type Story = StoryObj<typeof ResponsiveSelect>;

export const ResponsiveSelectStory: Story = {
  args: {
    options: ['Latest', 'Profile', 'Billing', 'Team', 'Subscription'],
    label: 'Sort By',
  },
};
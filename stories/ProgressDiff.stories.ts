import { ProgressDiff } from "@/components/ui/ProgressDiff";
import { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  component: ProgressDiff,
  title: "Finance/Atoms/ProgressDiff",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof ProgressDiff>;

export const Basic: Story = {
  args: {
    max: 100,
    currentValue: 35,
    incomingValue: 20,
    color: "green",
    className: "max-w-xs",
  },
};

export const CustomSizes: Story = {
  args: {
    max: 200,
    currentValue: 120,
    incomingValue: 40,
    color: "blue",
    className: "max-w-xs h-3 w-10",
  },
};

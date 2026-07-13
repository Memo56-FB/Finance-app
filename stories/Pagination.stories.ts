import { PaginationStory } from "@/components/ui/PaginationStory";
import { Meta, StoryObj } from "@storybook/nextjs";

const meta: Meta = {
  title: 'Finance/Pagination',
  component: PaginationStory,
  parameters: {
    // layout: 'centerd'
  }
}

export default meta

type Story = StoryObj<typeof PaginationStory>

export const Pagination: Story = {
  args: {
  }
}
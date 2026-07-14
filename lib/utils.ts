import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'preset-1',
            'preset-2',
            'preset-3',
            'preset-4',
            'preset-4-bold',
            'preset-5',
            'preset-5-bold',
          ],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const colorTags = [
  {
    value: 'green',
    label: 'Green',
  },
  {
    value: 'cyan',
    label: 'Cyan',
  },
  {
    value: 'navy',
    label: 'Navy',
  },
  {
    value: 'yellow',
    label: 'Yellow',
  },
  {
    value: 'magenta',
    label: 'Magenta',
  },
  {
    value: 'blue',
    label: 'Blue',
  },
  {
    value: 'navy-gray',
    label: 'Navy Gray',
  },
  {
    value: 'army-green',
    label: 'Army Green',
  },
  {
    value: 'gold',
    label: 'Gold',
  },
  {
    value: 'orange',
    label: 'Orange',
  },
]

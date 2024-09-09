import { SelectColorTag } from '@/components/ui/SelectColorTag'
import React from 'react'

const page = () => {
  return (
    <div>
      <SelectColorTag
        options={[
          {
            value: 'red',
            label: 'Red',
          },
          {
            value: 'green',
            label: 'Green',
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
        ]}
      />
    </div>
  )
}

export default page
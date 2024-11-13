import React from 'react'
import { SpendingSummary } from '@/app/ui/budgets/SpendingSummary'
import { BudgetsCard } from '@/app/ui/budgets/BudgetsCard'
import profile1 from '@/public/profilePictures/Logo-1.jpg'
import profile2 from '@/public/profilePictures/Logo-6.png'
import profile3 from '@/public/profilePictures/Person-10.jpg'
import profile4 from '@/public/profilePictures/Person-1.jpg'
import { CreateBudget } from '@/app/ui/budgets/CreateBudget'


const page = () => {
  return (
    <>
      <header className='flex justify-between'>
        <h1 className='text-preset-1 text-grey-900'>Budgets</h1>
        <CreateBudget />
      </header>
      <section className='grid gap-300 lg:grid-cols-2'>
        <SpendingSummary />
        <BudgetsCard
          color='green'
          free={'$500.00'}
          latest={{name: 'Papa Software', date: '20 Aug 2024', value: '$250.00', image: profile1}}
          ofValue={750.00}
          spent={250.00}
          title='Entertainment'
        />
        <BudgetsCard
          color='cyan'
          free={'$8'}
          latest={{name: 'Papa Software', date: '20 Aug 2024', value: '$250.00', image: profile2}}
          ofValue={75}
          spent={67}
          title='Entertainment'
        />
        <BudgetsCard
          color='yellow'
          free={'$50.00'}
          latest={{name: 'Papa Software', date: '20 Aug 2024', value: '$250.00', image: profile3}}
          ofValue={50.00}
          spent={25.00}
          title='Entertainment'
        />
        <BudgetsCard
          color='navy'
          free={'$35.00'}
          latest={{name: 'Papa Software', date: '20 Aug 2024', value: '$250.00', image: profile4}}
          ofValue={100.00}
          spent={65.00}
          title='Entertainment'
        />
      </section>
    </>
  )
}

export default page
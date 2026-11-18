import { finance } from './services'
import { cents } from './money'
import type { Transaction } from './types'

export async function recentExpenses(categoryId:string,month:string,signal?:AbortSignal,source=finance) {
  const result:Transaction[]=[]
  for(let page=0;page <= 2147483647;page++) {
    signal?.throwIfAborted()
    const history=await source.transactions({categoryId,sort:'newest',page,size:100},signal)
    for(const row of history.items) {
      if(row.transactionDate < month+'-01') return result
      if(row.transactionDate.startsWith(month+'-') && cents(row.amount) < 0n) result.push(row)
      if(result.length === 3) return result
    }
    if(!history.items.length || BigInt(page+1) >= BigInt(history.totalPages)) return result
  }
  return result
}

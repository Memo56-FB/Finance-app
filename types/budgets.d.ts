import { StaticImageData } from "next/image"

export type latestSpending = {
  name: string
  date: string 
  value: number | string
  image: string | StaticImageData
}
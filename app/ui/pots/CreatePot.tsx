import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { SelectColorTag } from "@/components/ui/SelectColorTag"
import { colorTags } from "@/lib/utils"

export const CreatePot = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className='flex text-preset-4 text-white'>
          + Add New Pot
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[320px] px-250 py-300 rounded-xl md:w-full grid gap-250">
        <DialogHeader className="grid justify-start gap-250">
          <DialogTitle className="text-start">Add New Pot</DialogTitle>
          <DialogDescription className="text-start">
            Create a pot to set savings targets. These can help keep you on track as you save for special purchases.
          </DialogDescription>
        </DialogHeader>
        <form action="" className="grid gap-200">
          <div className="grid gap-50">
            <label htmlFor="name" className="text-preset-5-bold text-grey-500">Pot Name</label>
            <Input placeholder="e.g. Rainy Days" />
            <span className="text-right text-preset-5 text-grey-500">x charactes left</span>
          </div>
          <div className="grid gap-50">
            <label htmlFor="name" className="text-preset-5-bold text-grey-500">Target</label>
            <div className="relative">
              <p className="text-beige-500 absolute left-250 top-[10px] text-preset-4">
                $
              </p>
              <Input placeholder="e.g. 2000" className="pl-500" />
            </div>
          </div>
          <div className="grid gap-50">
            <label htmlFor="name" className="text-preset-5-bold text-grey-500">Theme</label>
            <SelectColorTag
              options={colorTags}
            />
          </div>
          <Button className="text-preset-4-bold text-white">
            Add Pot
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

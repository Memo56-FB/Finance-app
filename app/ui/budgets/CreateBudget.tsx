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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SelectColorTag } from "@/components/ui/SelectColorTag"
import { colorTags } from "@/lib/utils"


export const CreateBudget = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className='flex text-preset-4 text-white'>
          + Add New Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[320px] px-250 py-300 rounded-xl md:w-full grid gap-250">
        <DialogHeader className="grid justify-start gap-250">
          <DialogTitle className="text-start">Add New Budget</DialogTitle>
          <DialogDescription className="text-start">
            Choose a category to set a spending budget. These categories can help you monitor spending.
          </DialogDescription>
        </DialogHeader>
        <form action="" className="grid gap-200">
          <div className="grid gap-50">
            <label htmlFor="name" className="text-preset-5-bold text-grey-500">Budget Category</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-50">
            <label htmlFor="name" className="text-preset-5-bold text-grey-500">Maximun Spending</label>
            <div className="relative">
              <p className="text-beige-500 absolute left-250 top-[10px] text-preset-4">
                $
              </p>
              <Input placeholder="e.g. 2000" className="pl-500" />
            </div>
          </div>
          <div className="grid gap-50">
            <label htmlFor="name" className="text-preset-5-bold text-grey-500">Color Tag</label>
            <SelectColorTag
              options={colorTags}
            />
          </div>
          <Button className="text-preset-4-bold text-white">
            Add Budget
          </Button>
        </form>
      </DialogContent>
    </Dialog>

  )
}

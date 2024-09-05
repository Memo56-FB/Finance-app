import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="">
      <p className="text-preset-1">
        This is text-preset-1
      </p>
      <p className="text-preset-2">
        This is text-preset-2
      </p>
      <p className="text-preset-3">
        This is text-preset-3
      </p>
      <p className="text-preset-4">
        This is text-preset-4
      </p>
      <p className="text-preset-4-bold ">
        This is text-preset-4 bold
      </p>
      <p className="text-preset-5">
        This is text-preset-5
      </p>
      <p className="text-preset-5-bold">
        This is text-preset-5 bold
      </p>
      <Button variant={'tertiary'}>
        this is button
      </Button>
    </main>
  );
}

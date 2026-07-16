"use client"

import { useState } from "react"
import { format, parse } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Replaces a native <input type="date"> — Chrome's built-in date widget jumps
// to today the moment you touch its spin arrows on an empty field, which
// reads as "picking a date doesn't work" from a click that never touched a
// real day. This gives full control: navigation arrows only ever navigate,
// only clicking a day cell sets a value.
export function DatePickerField({
  value,
  onChange,
  name,
  placeholder = "Elige una fecha",
  className,
  captionLayout = "label",
}: {
  value: string // "" or "yyyy-MM-dd"
  onChange: (value: string) => void
  name?: string
  placeholder?: string
  className?: string
  // "dropdown" swaps the prev/next-month arrows for month+year selects —
  // much faster for picking a birthdate decades back than clicking arrows.
  captionLayout?: "label" | "dropdown"
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {name && <input type="hidden" name={name} value={value} />}
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "justify-start font-normal",
          !value && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="size-4" />
        {selected ? format(selected, "d MMM yyyy", { locale: es }) : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          locale={es}
          captionLayout={captionLayout}
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return
            onChange(format(date, "yyyy-MM-dd"))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

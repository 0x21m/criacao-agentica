import { useEffect } from "react"
import { Demo } from "@/components/ui/market-snapshot"

export default function DemoOne() {
  // open the preview in dark by default; the sandbox theme toggle still works
  useEffect(() => { document.documentElement.classList.add("dark") }, [])
  return (
    <div className="w-full">
      <Demo />
    </div>
  )
}

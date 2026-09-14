import { Link } from "react-router-dom"
import { SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-muted">
        <SearchX className="size-8 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  )
}

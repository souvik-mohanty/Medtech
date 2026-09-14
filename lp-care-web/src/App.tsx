import { Toaster } from "@/components/ui/sonner"
import { QueryProvider } from "@/app/providers/QueryProvider"
import { AppRouter } from "@/app/router/AppRouter"

function App() {
  return (
    <QueryProvider>
      <AppRouter />
      <Toaster richColors position="top-right" />
    </QueryProvider>
  )
}

export default App

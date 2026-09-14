import { Construction } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"

/**
 * Used for nav destinations that are real, working routes but whose full
 * module (Phase 2–5 of the build) hasn't landed yet — every link in the
 * app must go somewhere real, never a blank or broken page.
 */
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <EmptyState icon={Construction} title="This module is coming soon" description={description} />
    </div>
  )
}

export type TestCategory =
  | "BLOOD"
  | "URINE"
  | "HORMONE"
  | "DIABETES"
  | "LIPID_PROFILE"
  | "LIVER_FUNCTION"
  | "KIDNEY_FUNCTION"
  | "THYROID"
  | "VITAMIN"
  | "ROUTINE_HEALTH"

export interface PathologyTest {
  id: string
  name: string
  code: string
  category: TestCategory
  description: string
  price: number
  sampleType: string
  preparationInstructions: string
  reportTurnaroundHours: number
  prescriptionRequired: boolean
  active: boolean
  /** Percent, e.g. 5 for 5%. 0 = no GST charged for this test. */
  gstPercentage: number
}

export interface TestPackage {
  id: string
  name: string
  description: string
  /** Full test objects, embedded directly by the backend combo response — no separate lookup needed. */
  tests: PathologyTest[]
  totalPrice: number
  discountedPrice: number
  preparationInstructions: string
  reportTurnaroundHours: number
  active: boolean
}

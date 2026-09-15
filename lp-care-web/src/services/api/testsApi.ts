import { apiClient } from "@/lib/apiClient"
import { getFranchiseId } from "@/services/api/franchiseApi"
import type { PathologyTest, TestCategory, TestPackage } from "@/types"

interface BackendLabTest {
  id: string
  name: string
  price: number
  active: boolean
  code: string | null
  category: TestCategory
  description: string | null
  sampleType: string | null
  preparationInstructions: string | null
  reportTurnaroundHours: number
  prescriptionRequired: boolean
}

interface BackendLabTestCombo {
  id: string
  name: string
  comboPrice: number
  totalPrice: number
  active: boolean
  tests: BackendLabTest[]
  description: string | null
  preparationInstructions: string | null
  reportTurnaroundHours: number
}

function toPathologyTest(t: BackendLabTest): PathologyTest {
  return {
    id: t.id,
    name: t.name,
    code: t.code ?? "",
    category: t.category,
    description: t.description ?? "",
    price: t.price,
    sampleType: t.sampleType ?? "",
    preparationInstructions: t.preparationInstructions ?? "",
    reportTurnaroundHours: t.reportTurnaroundHours,
    prescriptionRequired: t.prescriptionRequired,
    active: t.active,
  }
}

function toTestPackage(c: BackendLabTestCombo): TestPackage {
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? "",
    tests: c.tests.map(toPathologyTest),
    totalPrice: c.totalPrice,
    discountedPrice: c.comboPrice,
    preparationInstructions: c.preparationInstructions ?? "",
    reportTurnaroundHours: c.reportTurnaroundHours,
    active: c.active,
  }
}

export interface TestFilters {
  search?: string
  category?: TestCategory | "ALL"
  sort?: "PRICE_ASC" | "PRICE_DESC" | "NAME_ASC"
}

function applyFilters(tests: PathologyTest[], filters: TestFilters): PathologyTest[] {
  let results = tests
  if (filters.search) {
    const term = filters.search.toLowerCase()
    results = results.filter((t) => t.name.toLowerCase().includes(term) || t.code.toLowerCase().includes(term))
  }
  if (filters.category && filters.category !== "ALL") {
    results = results.filter((t) => t.category === filters.category)
  }
  if (filters.sort === "PRICE_ASC") results = [...results].sort((a, b) => a.price - b.price)
  if (filters.sort === "PRICE_DESC") results = [...results].sort((a, b) => b.price - a.price)
  if (filters.sort === "NAME_ASC") results = [...results].sort((a, b) => a.name.localeCompare(b.name))
  return results
}

// ---- Patient-facing (public — no login required, see SecurityConfig) ----

export async function getTests(filters: TestFilters = {}): Promise<PathologyTest[]> {
  const franchiseId = await getFranchiseId()
  const response = await apiClient.get<{ data: BackendLabTest[] }>(`/api/patient/franchises/${franchiseId}/labtests`)
  return applyFilters(response.data.data.filter((t) => t.active).map(toPathologyTest), filters)
}

export async function getTestById(id: string): Promise<PathologyTest | undefined> {
  const tests = await getTests()
  return tests.find((t) => t.id === id)
}

export async function getPackages(): Promise<TestPackage[]> {
  const franchiseId = await getFranchiseId()
  const response = await apiClient.get<{ data: BackendLabTestCombo[] }>(`/api/patient/franchises/${franchiseId}/labtests/combos`)
  return response.data.data.filter((c) => c.active).map(toTestPackage)
}

export async function getPackageById(id: string): Promise<TestPackage | undefined> {
  const packages = await getPackages()
  return packages.find((p) => p.id === id)
}

// ---- Owner-facing catalog management ----

export async function getAllTests(): Promise<PathologyTest[]> {
  const response = await apiClient.get<{ data: BackendLabTest[] }>("/api/franchise/labtests")
  return response.data.data.map(toPathologyTest)
}

export async function getAllPackages(): Promise<TestPackage[]> {
  const response = await apiClient.get<{ data: BackendLabTestCombo[] }>("/api/franchise/labtests/combos")
  return response.data.data.map(toTestPackage)
}

export type CreateTestInput = Omit<PathologyTest, "id" | "active">

export async function createTest(input: CreateTestInput): Promise<PathologyTest> {
  const response = await apiClient.post<{ data: BackendLabTest }>("/api/franchise/labtests", input)
  return toPathologyTest(response.data.data)
}

export async function toggleTestActive(id: string): Promise<PathologyTest> {
  const response = await apiClient.patch<{ data: BackendLabTest }>(`/api/franchise/labtests/${id}/toggle-active`)
  return toPathologyTest(response.data.data)
}

export async function updateTest(id: string, input: CreateTestInput): Promise<PathologyTest> {
  const response = await apiClient.put<{ data: BackendLabTest }>(`/api/franchise/labtests/${id}`, input)
  return toPathologyTest(response.data.data)
}

export async function deleteTest(id: string): Promise<void> {
  await apiClient.delete(`/api/franchise/labtests/${id}`)
}

export type CreatePackageInput = Omit<TestPackage, "id" | "active" | "totalPrice" | "tests"> & { testIds: string[] }

export async function createPackage(input: CreatePackageInput): Promise<TestPackage> {
  const { testIds, discountedPrice, ...rest } = input
  const response = await apiClient.post<{ data: BackendLabTestCombo }>("/api/franchise/labtests/combos", {
    ...rest,
    comboPrice: discountedPrice,
    testIds,
  })
  return toTestPackage(response.data.data)
}

export async function togglePackageActive(id: string): Promise<TestPackage> {
  const response = await apiClient.patch<{ data: BackendLabTestCombo }>(`/api/franchise/labtests/combos/${id}/toggle-active`)
  return toTestPackage(response.data.data)
}

export async function updatePackage(id: string, input: CreatePackageInput): Promise<TestPackage> {
  const { testIds, discountedPrice, ...rest } = input
  const response = await apiClient.put<{ data: BackendLabTestCombo }>(`/api/franchise/labtests/combos/${id}`, {
    ...rest,
    comboPrice: discountedPrice,
    testIds,
  })
  return toTestPackage(response.data.data)
}

export async function deletePackage(id: string): Promise<void> {
  await apiClient.delete(`/api/franchise/labtests/combos/${id}`)
}

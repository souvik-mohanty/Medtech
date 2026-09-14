export interface RevenuePoint {
  date: string
  revenue: number
}

export interface BookingTrendPoint {
  date: string
  bookings: number
}

export interface CategoryShare {
  category: string
  value: number
}

export interface OwnerAnalytics {
  totalPatients: number
  todaysBookings: number
  upcomingCollections: number
  pendingReports: number
  completedReports: number
  totalRevenue: number
  todaysRevenue: number
  pendingPayments: number
  cancelledBookings: number
  revenueTrend: RevenuePoint[]
  bookingTrend: BookingTrendPoint[]
  popularTests: CategoryShare[]
  categoryDistribution: CategoryShare[]
  collectionMethodDistribution: CategoryShare[]
  bookingStatusDistribution: CategoryShare[]
}

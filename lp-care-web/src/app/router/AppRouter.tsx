import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { PublicLayout } from "@/components/layouts/PublicLayout"
import { PatientLayout } from "@/components/layouts/PatientLayout"
import { OwnerLayout } from "@/components/layouts/OwnerLayout"
import { ProtectedRoute, RoleRoute, GuestOnlyRoute } from "@/app/router/ProtectedRoute"

import { HomePage } from "@/pages/public/HomePage"
import { AboutPage } from "@/pages/public/AboutPage"
import { ServicesPage } from "@/pages/public/ServicesPage"
import { TestsPage } from "@/pages/public/TestsPage"
import { TestDetailPage } from "@/pages/public/TestDetailPage"
import { PackagesPage } from "@/pages/public/PackagesPage"
import { PackageDetailPage } from "@/pages/public/PackageDetailPage"
import { SampleCollectionPage } from "@/pages/public/SampleCollectionPage"
import { ContactPage } from "@/pages/public/ContactPage"
import { NotFoundPage } from "@/pages/public/NotFoundPage"

import { LoginPage } from "@/pages/auth/LoginPage"

import { PatientDashboardPage } from "@/pages/patient/DashboardPage"
import { PatientProfilePage } from "@/pages/patient/ProfilePage"
import { FamilyMembersPage } from "@/pages/patient/FamilyMembersPage"
import { PatientBookingsPage } from "@/pages/patient/BookingsPage"
import { PatientTestsPage } from "@/pages/patient/TestsPage"
import { PatientPackagesPage } from "@/pages/patient/PackagesPage"
import { BookTestPage } from "@/pages/patient/BookTestPage"
import { BookDoctorPage } from "@/pages/patient/BookDoctorPage"
import { PatientAppointmentsPage } from "@/pages/patient/AppointmentsPage"
import { PatientMedicinesPage } from "@/pages/patient/MedicinesPage"
import { MedicineCheckoutPage } from "@/pages/patient/MedicineCheckoutPage"
import { PatientOrdersPage } from "@/pages/patient/OrdersPage"
import { PatientPaymentsPage } from "@/pages/patient/PaymentsPage"
import { ReportsPage } from "@/pages/patient/ReportsPage"
import { InvoicesPage } from "@/pages/patient/InvoicesPage"
import { NotificationsPage } from "@/pages/patient/NotificationsPage"
import { SettingsPage } from "@/pages/patient/SettingsPage"

import { OwnerDashboardPage } from "@/pages/owner/DashboardPage"
import { OwnerPatientsPage } from "@/pages/owner/PatientsPage"
import { OwnerPatientDetailPage } from "@/pages/owner/PatientDetailPage"
import { OwnerTestsPage } from "@/pages/owner/TestsPage"
import { OwnerBookingsPage } from "@/pages/owner/BookingsPage"
import { OwnerPendingOrdersPage } from "@/pages/owner/PendingOrdersPage"
import { OwnerPaymentsPage } from "@/pages/owner/PaymentsPage"
import { OwnerInvoicesPage } from "@/pages/owner/InvoicesPage"
import { OwnerCouponsPage } from "@/pages/owner/CouponsPage"
import { OwnerReferralsPage } from "@/pages/owner/ReferralsPage"
import { OwnerDoctorsPage } from "@/pages/owner/DoctorsPage"
import { OwnerInventoryPage } from "@/pages/owner/InventoryPage"
import { OwnerOrdersPage } from "@/pages/owner/OrdersPage"
import { OwnerWalkInPage } from "@/pages/owner/WalkInPage"
import { OwnerAnalyticsPage } from "@/pages/owner/AnalyticsPage"
import { OwnerNotificationsPage } from "@/pages/owner/NotificationsPage"
import { OwnerSettingsPage } from "@/pages/owner/SettingsPage"
import { OwnerProfilePage } from "@/pages/owner/ProfilePage"

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public website */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/tests/:testId" element={<TestDetailPage />} />
          <Route path="/packages" element={<PackagesPage />} />
          <Route path="/packages/:packageId" element={<PackageDetailPage />} />
          <Route path="/sample-collection" element={<SampleCollectionPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>

        {/* Auth */}
        <Route path="/login" element={<GuestOnlyRoute><LoginPage mode="login" /></GuestOnlyRoute>} />
        <Route path="/register" element={<GuestOnlyRoute><LoginPage mode="register" /></GuestOnlyRoute>} />

        {/* Patient portal */}
        <Route
          element={
            <ProtectedRoute>
              <RoleRoute role="PATIENT">
                <PatientLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="/patient" element={<PatientDashboardPage />} />
          <Route path="/patient/profile" element={<PatientProfilePage />} />
          <Route path="/patient/family" element={<FamilyMembersPage />} />
          <Route path="/patient/tests" element={<PatientTestsPage />} />
          <Route path="/patient/packages" element={<PatientPackagesPage />} />
          <Route path="/patient/book" element={<BookTestPage />} />
          <Route path="/patient/bookings" element={<PatientBookingsPage />} />
          <Route path="/patient/book-doctor" element={<BookDoctorPage />} />
          <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
          <Route path="/patient/medicines" element={<PatientMedicinesPage />} />
          <Route path="/patient/medicines/checkout" element={<MedicineCheckoutPage />} />
          <Route path="/patient/orders" element={<PatientOrdersPage />} />
          <Route path="/patient/payments" element={<PatientPaymentsPage />} />
          <Route path="/patient/reports" element={<ReportsPage />} />
          <Route path="/patient/invoices" element={<InvoicesPage />} />
          <Route path="/patient/notifications" element={<NotificationsPage />} />
          <Route path="/patient/settings" element={<SettingsPage />} />
        </Route>

        {/* Owner dashboard */}
        <Route
          element={
            <ProtectedRoute>
              <RoleRoute role="OWNER">
                <OwnerLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="/owner" element={<OwnerDashboardPage />} />
          <Route path="/owner/patients" element={<OwnerPatientsPage />} />
          <Route path="/owner/patients/:patientId" element={<OwnerPatientDetailPage />} />
          <Route path="/owner/tests" element={<OwnerTestsPage />} />
          <Route path="/owner/packages" element={<Navigate to="/owner/tests" replace />} />
          <Route path="/owner/bookings" element={<OwnerBookingsPage />} />
          <Route path="/owner/walk-in" element={<OwnerWalkInPage />} />
          <Route path="/owner/pending-orders" element={<OwnerPendingOrdersPage />} />
          <Route path="/owner/payments" element={<OwnerPaymentsPage />} />
          <Route path="/owner/invoices" element={<OwnerInvoicesPage />} />
          <Route path="/owner/coupons" element={<OwnerCouponsPage />} />
          <Route path="/owner/referrals" element={<OwnerReferralsPage />} />
          <Route path="/owner/doctors" element={<OwnerDoctorsPage />} />
          <Route path="/owner/inventory" element={<OwnerInventoryPage />} />
          <Route path="/owner/orders" element={<OwnerOrdersPage />} />
          <Route path="/owner/analytics" element={<OwnerAnalyticsPage />} />
          <Route path="/owner/notifications" element={<OwnerNotificationsPage />} />
          <Route path="/owner/settings" element={<OwnerSettingsPage />} />
          <Route path="/owner/profile" element={<OwnerProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

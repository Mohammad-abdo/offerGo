import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Riders from './pages/admin/Riders'
import Drivers from './pages/admin/Drivers'
import Fleets from './pages/admin/Fleets'
import RideRequests from './pages/admin/RideRequests'
import RideRequestDetails from './pages/admin/RideRequestDetails'
import Dispatch from './pages/admin/Dispatch'
import Services from './pages/admin/Services'
import Coupons from './pages/admin/Coupons'
import Documents from './pages/admin/Documents'
import Complaints from './pages/admin/Complaints'
import Reports from './pages/admin/Reports'
import Settings from './pages/admin/Settings'
import Regions from './pages/admin/Regions'
import DriverDocuments from './pages/admin/DriverDocuments'
import WithdrawRequests from './pages/admin/WithdrawRequests'
import AdditionalFees from './pages/admin/AdditionalFees'
import SurgePrices from './pages/admin/SurgePrices'
import Airports from './pages/admin/Airports'
import FAQs from './pages/admin/FAQs'
import Cancellations from './pages/admin/Cancellations'
import SOS from './pages/admin/SOS'
import Roles from './pages/admin/Roles'
import Permissions from './pages/admin/Permissions'
import MailTemplates from './pages/admin/MailTemplates'
import SMSTemplates from './pages/admin/SMSTemplates'
import Languages from './pages/admin/Languages'
import LanguageKeywords from './pages/admin/LanguageKeywords'
import Pages from './pages/admin/Pages'
import FrontendData from './pages/admin/FrontendData'
import SubAdmin from './pages/admin/SubAdmin'
import Payments from './pages/admin/Payments'
import Notifications from './pages/admin/Notifications'
import Wallets from './pages/admin/Wallets'
import References from './pages/admin/References'
import ManageZones from './pages/admin/ManageZones'
import ManageZonePrices from './pages/admin/ManageZonePrices'
import VehicleTracking from './pages/admin/VehicleTracking'
import WorkAreas from './pages/admin/WorkAreas'
import CustomerSupport from './pages/admin/CustomerSupport'
import WhyChoose from './pages/admin/WhyChoose'
import OurMission from './pages/admin/OurMission'
import ClientTestimonials from './pages/admin/ClientTestimonials'
import DemandMap from './pages/admin/DemandMap'
import Profile from './pages/Profile'
import Layout from './components/Layout'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            className: '',
            duration: 4000,
            style: {
              background: '#fff',
              color: '#1f2937',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e5e7eb',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="riders" element={<Riders />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="fleets" element={<Fleets />} />
              <Route path="ride-requests" element={<RideRequests />} />
              <Route path="ride-requests/:id" element={<RideRequestDetails />} />
              <Route path="dispatch" element={<Dispatch />} />
              <Route path="services" element={<Services />} />
              <Route path="regions" element={<Regions />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="documents" element={<Documents />} />
              <Route path="driver-documents" element={<DriverDocuments />} />
              <Route path="complaints" element={<Complaints />} />
              <Route path="sos" element={<SOS />} />
              <Route path="withdraw-requests" element={<WithdrawRequests />} />
              <Route path="additional-fees" element={<AdditionalFees />} />
              <Route path="surge-prices" element={<SurgePrices />} />
              <Route path="airports" element={<Airports />} />
              <Route path="faqs" element={<FAQs />} />
              <Route path="cancellations" element={<Cancellations />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="roles" element={<Roles />} />
              <Route path="permissions" element={<Permissions />} />
              <Route path="mail-templates" element={<MailTemplates />} />
              <Route path="sms-templates" element={<SMSTemplates />} />
              <Route path="languages" element={<Languages />} />
              <Route path="language-keywords" element={<LanguageKeywords />} />
              <Route path="pages" element={<Pages />} />
              <Route path="frontend-data" element={<FrontendData />} />
              <Route path="sub-admin" element={<SubAdmin />} />
              <Route path="payments" element={<Payments />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="wallets" element={<Wallets />} />
              <Route path="references" element={<References />} />
              <Route path="manage-zones" element={<ManageZones />} />
              <Route path="manage-zone-prices" element={<ManageZonePrices />} />
              <Route path="vehicle-tracking" element={<VehicleTracking />} />
              <Route path="work-areas" element={<WorkAreas />} />
              <Route path="customer-support" element={<CustomerSupport />} />
              <Route path="why-choose" element={<WhyChoose />} />
              <Route path="our-mission" element={<OurMission />} />
              <Route path="client-testimonials" element={<ClientTestimonials />} />
              <Route path="demand-map" element={<DemandMap />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App


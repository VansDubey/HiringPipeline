import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '../context/useSession'

function ProtectedRoute() {
  const { status } = useSession()
  const location = useLocation()

  if (status === 'loading') {
    return <div className="route-loading">Loading workspace...</div>
  }

  if (status === 'anonymous') {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return <Outlet />
}

export default ProtectedRoute

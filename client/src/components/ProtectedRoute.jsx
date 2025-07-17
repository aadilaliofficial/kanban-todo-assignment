import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (token) {
    return children;
  }

  return (
    <div className="d-flex vh-100 justify-content-center align-items-center">
      <div className="text-center p-4 border rounded shadow" style={{ maxWidth: '300px' }}>
        <h4 className="mb-3 text-danger">Access Denied</h4>
        <p>Please login to continue.</p>
        <Navigate to="/login" replace />
      </div>
    </div>
  );
};

export default ProtectedRoute;

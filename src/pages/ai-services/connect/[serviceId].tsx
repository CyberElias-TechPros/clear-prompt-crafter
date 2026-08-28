import React from "react";
import { Navigate } from "react-router-dom";

// The connection flow now lives inline on /ai-services. This route is kept for
// backward compatibility and simply forwards users there.
export default function ConnectServicePage() {
  return <Navigate to="/ai-services" replace />;
}

import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { AppShellPage } from "./pages/AppShellPage.js";
import { ChannelPage } from "./pages/ChannelPage.js";
import { DefaultAppRedirect } from "./pages/DefaultAppRedirect.js";
import { WelcomePage } from "./pages/WelcomePage.js";
import { ProtectedRoute } from "./routes/ProtectedRoute.js";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<DefaultAppRedirect />} />
        <Route path="/app/welcome" element={<WelcomePage />} />
        <Route path="/app/:orgSlug/:channelId" element={<AppShellPage />}>
          <Route index element={<ChannelPage />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

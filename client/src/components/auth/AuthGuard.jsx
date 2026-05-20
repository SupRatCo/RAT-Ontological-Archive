import LoginPage from "../../pages/LoginPage";

export default function AuthGuard({ user, children }) {
  if (!user) return <LoginPage />;
  return children;
}

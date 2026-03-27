import { Link } from "react-router-dom";

export function WelcomePage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <h1 className="text-xl font-semibold text-slate-900">No organizations yet</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        Create an organization using the API (for example{" "}
        <code className="rounded bg-slate-200 px-1 py-0.5 text-xs">POST /api/organizations</code>
        ), then refresh this page.
      </p>
      <Link
        to="/app"
        className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        Try again
      </Link>
    </div>
  );
}

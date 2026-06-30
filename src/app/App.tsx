import { RouterProvider } from "react-router";

import { ErrorBoundary } from "./ErrorBoundary";
import { createAppRouter } from "./router";

const router = createAppRouter();

export function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

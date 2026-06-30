import { lazy, Suspense, type ReactElement } from "react";
import { createBrowserRouter } from "react-router";

import { AppLayout } from "../components/AppLayout";
import { LoadingView } from "../components/LoadingView";
import { Providers } from "./Providers";
import { appRoutes } from "./routes";

const HomePage = lazy(() => import("../features/home/HomePage"));
const DailyPage = lazy(() => import("../features/daily/DailyPage"));
const TroopPage = lazy(() => import("../features/multiplayer/TroopPage"));
const NotFoundPage = lazy(() => import("../features/home/NotFoundPage"));

function withSuspense(element: ReactElement) {
  return <Suspense fallback={<LoadingView />}>{element}</Suspense>;
}

export function createAppRouter() {
  return createBrowserRouter([
    {
      path: appRoutes.home,
      element: (
        <Providers>
          <AppLayout />
        </Providers>
      ),
      children: [
        {
          index: true,
          element: withSuspense(<HomePage />)
        },
        {
          path: "daily",
          element: withSuspense(<DailyPage />)
        },
        {
          path: "troop/new",
          element: withSuspense(<TroopPage mode="create" />)
        },
        {
          path: "troop/:roomCode",
          element: withSuspense(<TroopPage mode="join" />)
        },
        {
          path: "*",
          element: withSuspense(<NotFoundPage />)
        }
      ]
    }
  ]);
}

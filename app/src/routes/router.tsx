// The app's router (React Router data router). The home page renders inside HomeLayout (no top
// bar, it draws its own); every other route renders inside AppLayout. The editor, simulator and
// replay pages are lazy-loaded so the first page loads faster.

import { createBrowserRouter } from "react-router";
import {
  ConnectionCheckPage,
  CreateLobbyPage,
  LeaderboardPage,
  LobbiesPage,
  LobbyPage,
  MatchPage,
  ProfilePage,
  ResultsPage,
  RouteErrorPage,
  RulesPage,
} from "../pages";
import { AppLayout, HomeLayout } from "./AppLayout";
import { paths } from "./paths";

export const router = createBrowserRouter([
  {
    element: <HomeLayout />,
    errorElement: <RouteErrorPage />,
    children: [{ path: paths.home, element: <LobbiesPage /> }],
  },
  {
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { path: paths.createLobby, element: <CreateLobbyPage /> },
          { path: paths.lobby, element: <LobbyPage /> },
          {
            path: paths.editor,
            lazy: async () => ({ Component: (await import("../pages/EditorPage")).EditorPage }),
          },
          {
            path: paths.simulator,
            lazy: async () => ({ Component: (await import("../pages/SimulatorPage")).SimulatorPage }),
          },
          { path: paths.match, element: <MatchPage /> },
          {
            path: paths.replay,
            lazy: async () => ({ Component: (await import("../pages/ReplayPage")).ReplayPage }),
          },
          { path: paths.results, element: <ResultsPage /> },
          { path: paths.leaderboard, element: <LeaderboardPage /> },
          { path: paths.rules, element: <RulesPage /> },
          { path: paths.profile, element: <ProfilePage /> },
          { path: paths.connectionCheck, element: <ConnectionCheckPage /> },
          { path: "*", element: <RouteErrorPage /> },
        ],
      },
    ],
  },
]);

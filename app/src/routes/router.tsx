// The app's router (React Router data router). Each route maps a path from `paths.ts` to a page.

import { createBrowserRouter } from "react-router";
import { ConnectionCheckPage, HomePage } from "../pages";
import { paths } from "./paths";

export const router = createBrowserRouter([
  {
    path: paths.home,
    element: <HomePage />,
  },
  {
    path: paths.connectionCheck,
    element: <ConnectionCheckPage />,
  },
]);

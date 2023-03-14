import {
  RouterProvider,
  createRoutesFromElements,
  createBrowserRouter,
  Route,
} from "react-router-dom";
import PeerPage from "./routes/peer";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route index element={"Home"} />
      <Route path="p" element={<PeerPage />} />
    </Route>
  )
);

export default function App() {
  return <RouterProvider router={router} />;
}

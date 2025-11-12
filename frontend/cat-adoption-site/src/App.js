import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import AvailableCats from "./pages/Cats";
import Home from "./pages/Home";
import Insights from "./pages/Insights";
import CatDetail from "./pages/CatDetail";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        {/* Navigation Bar */}
        <nav className="p-4 bg-gradient-to-r from-pink-100 via-pink-200 to-pink-100 text-gray-700 flex justify-center gap-10 shadow-md border-b border-pink-200">
            <Link
              to="/"
              className="hover:text-pink-500 font-medium transition-transform hover:scale-105"
            >
              Home
            </Link>
            <Link
              to="/cats"
              className="hover:text-pink-500 font-medium transition-transform hover:scale-105"
            >
              Available Cats
            </Link>
            <Link
              to="/insights"
              className="hover:text-pink-500 font-medium transition-transform hover:scale-105"
            >
              Adoption Insights
            </Link>
          </nav>


        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cats" element={<AvailableCats />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/cats/:id" element={<CatDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

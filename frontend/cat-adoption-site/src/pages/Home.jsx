import React from "react";
import { Link } from "react-router-dom";
import { Heart, PawPrint, Home as HomeIcon } from "lucide-react";
import catLogo from "../assets/cat_logo.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-pink-50 to-white flex flex-col items-center font-[Poppins] text-gray-800">
      {/* Header / Logo */}
      <header className="relative flex flex-col items-center text-center mt-10">
        <div className="relative flex flex-col items-center">
            <img
            src={catLogo}
            alt="FurEverHome Cat Logo"
            className="pointer-events-none w-44 sm:w-52 drop-shadow-xl animate-bounce absolute -top-12 z-10"
            loading="lazy"
            />
            <h1 className="text-6xl font-extrabold text-gray-900 tracking-tight pt-32 relative z-0 -mt-6">
            Fur<span className="text-pink-400">Ever</span>Home
            </h1>
        </div>

        {/* Nav Links */}
        <div className="flex space-x-12 mt-6 text-lg font-semibold relative z-20">
            <Link
            to="/cats"
            className="px-5 py-2 rounded-lg bg-pink-200 hover:bg-pink-300 text-gray-700 shadow-sm hover:shadow-md transition-all duration-300"
            >
            Find Your Match
            </Link>
            <Link
            to="/insights"
            className="px-5 py-2 rounded-lg bg-pink-200 hover:bg-pink-300 text-gray-700 shadow-sm hover:shadow-md transition-all duration-300"
            >
            View Adoption Insights
            </Link>
        </div>
        </header>
      {/* Available Section */}
      <section className="text-center mt-16">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-2 text-gray-900">
          Available Near You
        </h2>
        <p className="text-gray-600 italic text-lg">
          Discover loving cats waiting for their forever homes 🐾
        </p>
      </section>

      {/* Why Adopt */}
      <section className="max-w-3xl mt-16 bg-white/80 rounded-2xl border border-pink-200 shadow-lg p-10 backdrop-blur-md">
        <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Why Adopt:
        </h3>

        <ul className="space-y-6 text-lg">
          <li className="flex items-start space-x-3">
            <Heart className="text-pink-400 w-7 h-7 mt-1" />
            <span>Save a life and open your heart ❤️</span>
          </li>
          <li className="flex items-start space-x-3">
            <PawPrint className="text-rose-400 w-7 h-7 mt-1" />
            <span>Thousands of cats are waiting for loving homes 🏠</span>
          </li>
          <li className="flex items-start space-x-3">
            <HomeIcon className="text-amber-400 w-7 h-7 mt-1" />
            <span>Every adoption makes room for another rescue 🐾</span>
          </li>
        </ul>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-center px-6">
        <div className="bg-pink-50 p-8 rounded-2xl shadow hover:shadow-lg hover:-translate-y-1 transition-all border border-pink-200">
          <h4 className="text-4xl font-extrabold text-pink-500">200+</h4>
          <p className="text-gray-600 mt-1">Cats Analyzed</p>
        </div>
        <div className="bg-pink-50 p-8 rounded-2xl shadow hover:shadow-lg hover:-translate-y-1 transition-all border border-pink-200">
          <h4 className="text-4xl font-extrabold text-green-500">70%</h4>
          <p className="text-gray-600 mt-1">Adoption Success Rate</p>
        </div>
        <div className="bg-pink-50 p-8 rounded-2xl shadow hover:shadow-lg hover:-translate-y-1 transition-all border border-pink-200">
          <h4 className="text-4xl font-extrabold text-rose-500">Siamese</h4>
          <p className="text-gray-600 mt-1">Top Breed</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="mt-20 mb-16 max-w-4xl text-center">
        <h3 className="text-3xl font-bold mb-8 text-gray-800">How It Works</h3>
        <div className="flex flex-col md:flex-row justify-center items-center gap-10 md:gap-16">
          {[
            { step: 1, text: "Browse cats" },
            { step: 2, text: "Learn their background" },
            { step: 3, text: "Contact shelter" },
            { step: 4, text: "Meet & Adopt" },
          ].map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center bg-white border border-pink-200 shadow-md hover:shadow-xl rounded-2xl p-6 w-56 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-3xl font-extrabold text-pink-500 mb-2">
                {s.step}
              </div>
              <p className="text-gray-700 font-medium">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 bg-pink-100 border-t border-pink-200 text-gray-600 text-sm text-center shadow-inner">
        © {new Date().getFullYear()} FurEverHome — Built by Dora Lei 🐱
      </footer>
    </div>
  );
}

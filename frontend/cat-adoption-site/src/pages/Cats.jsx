import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

export default function Cats() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [state, setState] = useState(searchParams.get("state") || "");
  const [zipcode, setZipcode] = useState(searchParams.get("zipcode") || "");
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [hasMore, setHasMore] = useState(true);

  // Fetch cats
  const searchCats = async (newPage = 1) => {
    if (!zipcode && !city && !state) {
      setError("Please enter a city, state, or zipcode 🏠");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        city,
        state,
        zipcode,
        limit: 9,
        page: newPage,
      });

      setSearchParams({ city, state, zipcode, page: newPage });

      const res = await fetch(
        `http://localhost:5050/api/search_cats?${params.toString()}`
      );
      const data = await res.json();

      if (res.ok) {
        if (newPage === 1) setCats(data.cats);
        else setCats((prev) => [...prev, ...data.cats]);
        setHasMore(data.has_more || data.cats?.length === 9);
        setPage(newPage);
      } else {
        setError(data.error || "No cats found 😿");
      }
    } catch {
      setError("Something went wrong. Try again later.");
    }

    setLoading(false);
  };

  // Restore Previous Search
  useEffect(() => {
    const queryCity = searchParams.get("city") || "";
    const queryState = searchParams.get("state") || "";
    const queryZip = searchParams.get("zipcode") || "";
    const queryPage = Number(searchParams.get("page") || 1);

    setCity(queryCity);
    setState(queryState);
    setZipcode(queryZip);

    if (queryCity || queryState || queryZip) {
      searchCats(queryPage);
    }
  }, []);

  // Date formatting helper
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-10 font-[Poppins] text-gray-800">
      <h1 className="text-4xl font-extrabold text-center text-pink-500 mb-6">
        🐾 Find Cats Near You
      </h1>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mb-8">
        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="p-3 border border-pink-300 rounded-lg focus:outline-none w-40 shadow-sm"
        />
        <input
          type="text"
          placeholder="State (e.g., NY)"
          value={state}
          onChange={(e) => setState(e.target.value.toUpperCase())}
          className="p-3 border border-pink-300 rounded-lg focus:outline-none w-32 shadow-sm"
          maxLength={2}
        />
        <input
          type="text"
          placeholder="Zipcode"
          value={zipcode}
          onChange={(e) => setZipcode(e.target.value)}
          className="p-3 border border-pink-300 rounded-lg focus:outline-none w-32 shadow-sm"
        />
        <button
          onClick={() => searchCats(1)}
          className="bg-pink-400 hover:bg-pink-500 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition-all"
        >
          Search
        </button>
      </div>

      {loading && (
        <p className="text-center text-gray-600 italic">
          Loading adorable cats... 🐱
        </p>
      )}
      {error && <p className="text-center text-red-500 font-medium">{error}</p>}

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        {cats
          .filter((cat) => !cat.animalAdoptedDate) // exclude adopted cats
          .map((cat, i) => (
            <Link
              key={i}
              to={`/cats/${cat.id}`}
              state={{
                from: `/cats?city=${city}&state=${state}&zipcode=${zipcode}&page=${page}`,
              }}
              className="bg-white rounded-2xl border border-pink-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 block"
            >
              <img
                src={cat.image || "https://placekitten.com/400/300"}
                alt={cat.name}
                className="w-full h-56 object-cover rounded-t-2xl"
              />
              <div className="p-5 text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {cat.name || "Unnamed Cat"}
                </h2>
                <p className="text-gray-600 text-sm">
                  <strong>Breed:</strong> {cat.breed || "Unknown"}
                </p>
                <p className="text-gray-600 text-sm">
                  <strong>Color:</strong> {cat.color || "Unknown"}
                </p>
                <p className="text-gray-600 text-sm">
                  <strong>Sex:</strong> {cat.sex || "Unknown"}
                </p>
                <p className="text-gray-700 text-sm mt-2">
                  <strong>Shelter:</strong> {cat.shelter || "N/A"}
                </p>
                <p className="text-gray-500 text-sm italic">
                  {cat.location || "Location not listed"}
                </p>

                {/* 🗓️ Date listed */}
                {cat.animalAvailableDate && (
                    <p className="text-xs text-gray-500 mt-1 italic">
                        Listed on {formatDate(cat.animalAvailableDate)}
                    </p>
                    )}
                    {cat.animalUpdatedDate && (
                    <p className="text-xs text-gray-400 italic">
                        Updated on {formatDate(cat.animalUpdatedDate)}
                    </p>
                )}
              </div>
            </Link>
          ))}
      </div>

      {/* Pagination */}
      {hasMore && cats.length > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={() => searchCats(page + 1)}
            className="bg-pink-400 hover:bg-pink-500 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition-all"
          >
            Load More Cats 🐾
          </button>
        </div>
      )}

      {!hasMore && cats.length > 0 && (
        <p className="text-center text-gray-500 mt-4">
          No more cats found 🐱
        </p>
      )}
    </div>
  );
}

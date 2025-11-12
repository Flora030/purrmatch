import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";

export default function CatDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [cat, setCat] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5050/api/cat/${id}`)
      .then((res) => res.json())
      .then((data) => setCat(data))
      .catch((err) => console.error("Error fetching cat details:", err));
  }, [id]);

  if (!cat) return <p className="text-center mt-10">Loading cat details...</p>;

  const backLink = location.state?.from || "/cats";

  // Determine if contact info exists before rendering the card
  const hasShelterInfo =
    cat.location_name || cat.location_city || cat.location_state || cat.location_phone || cat.location_url;

  const hasFosterInfo =
    cat.foster_name || cat.foster_email || cat.foster_phone_cell;

  const hasContactInfo = hasShelterInfo || hasFosterInfo;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Go back link now preserves filters */}
      <Link to={backLink} className="text-pink-500 hover:underline">
        &larr; Back to Available Cats
      </Link>

      <div className="mt-6 bg-pink-50 p-6 rounded-xl shadow-md">
        <img
          src={cat.image}
          alt={cat.name}
          className="rounded-xl mx-auto mb-4 max-h-80 object-cover"
        />
        <h1 className="text-3xl font-semibold text-center mb-2">{cat.name}</h1>
        <p className="text-center text-gray-600 mb-4">
          {cat.breed} • {cat.sex} • {cat.age}
        </p>
        <p className="text-gray-700 mb-6">{cat.description}</p>

        {/* Traits to Show */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-800">
          <p><strong>Energy Level:</strong> {cat.energy_level || "Unknown"}</p>
          <p><strong>Good with Cats:</strong> {cat.ok_with_cats || "Unknown"}</p>
          <p><strong>Good with Dogs:</strong> {cat.ok_with_dogs || "Unknown"}</p>
          <p><strong>Good with Kids:</strong> {cat.ok_with_kids || "Unknown"}</p>
          <p><strong>Microchipped:</strong> {cat.microchipped || "Unknown"}</p>
          <p><strong>Altered:</strong> {cat.altered || "Unknown"}</p>
          <p><strong>Special Needs:</strong> {cat.special_needs || "No"}</p>
        </div>

        {cat.special_needs_desc && (
          <div className="mt-4 bg-red-50 p-3 rounded-lg text-red-700">
            <strong>Special Needs Description:</strong> {cat.special_needs_desc}
          </div>
        )}

        {/* Location */}
        <p className="mt-6 text-center text-gray-600">
          Located in <strong>{cat.location || cat.location_citystate || "Unknown"}</strong>
        </p>

        {/* Dates */}
        <div className="mt-4 text-center text-gray-600 text-sm">
            {cat.animalAvailableDate && (
                <p>📅 <strong>Listed on:</strong> {new Date(cat.animalAvailableDate).toLocaleDateString()}</p>
            )}
            {cat.animalUpdatedDate && (
                <p>🔄 <strong>Last Updated:</strong> {new Date(cat.animalUpdatedDate).toLocaleDateString()}</p>
            )}
        </div>

        {/* Link to rescue page */}
        {cat.link && (
          <div className="mt-4 text-center">
            <a
              href={cat.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-500 hover:underline"
            >
              View Full Profile on RescueGroups
            </a>
          </div>
        )}

        {/* Contact Information (only show if available) */}
        {hasContactInfo && (
          <div className="mt-8 bg-white p-4 rounded-lg shadow-sm border border-pink-200">
            <h2 className="text-lg font-semibold text-pink-600 mb-3 text-center">
              Contact Information
            </h2>

            {/* Shelter Info */}
            {hasShelterInfo && (
              <>
                {cat.location_name && <p><strong>Shelter:</strong> {cat.location_name}</p>}
                {(cat.location_city || cat.location_state) && (
                  <p>
                    <strong>Address:</strong>{" "}
                    {cat.location_city || ""} {cat.location_state ? `, ${cat.location_state}` : ""}{" "}
                    {cat.location_postalcode || ""}
                  </p>
                )}
                {cat.location_phone && <p><strong>Phone:</strong> {cat.location_phone}</p>}
                {cat.location_url && (
                  <p>
                    <strong>Website:</strong>{" "}
                    <a
                      href={cat.location_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 hover:underline"
                    >
                      {cat.location_url}
                    </a>
                  </p>
                )}
              </>
            )}

            {/* Foster Info */}
            {hasFosterInfo && (
              <>
                {hasShelterInfo && <hr className="my-3 border-pink-200" />}
                <h3 className="text-md font-semibold text-pink-500 mb-1">
                  Foster Contact
                </h3>
                {cat.foster_name && <p><strong>Name:</strong> {cat.foster_name}</p>}
                {cat.foster_email && <p><strong>Email:</strong> {cat.foster_email}</p>}
                {cat.foster_phone_cell && <p><strong>Phone:</strong> {cat.foster_phone_cell}</p>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

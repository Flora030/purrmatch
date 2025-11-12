import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";

const DATA_URL = "http://localhost:5050/data/combined_adoption_data_cats.csv";
const AdoptionSpeedLegend = () => (
  <div>
    <p
      style={{
        margin: 0,
        fontWeight: 700,
        color: "#c026d3",
        textAlign: "center",
        fontSize: 16, // ⬆️ Increased from 13 → 16
      }}
    >
      📘 Legend
    </p>
    <ul
      style={{
        listStyle: "disc",
        paddingLeft: 22, // a bit more padding
        marginTop: 8,
        marginBottom: 0,
        fontSize: 15, // ⬆️ Increased from ~12 to 15
        lineHeight: 1.8, // better spacing
      }}
    >
      <li><b>0</b> — Adopted same day</li>
      <li><b>1</b> — 1–7 days</li>
      <li><b>2</b> — 8–30 days</li>
      <li><b>3</b> — 31–90 days</li>
      <li><b>4</b> — 100+ days</li>
    </ul>
  </div>
);

export default function Insights() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Papa.parse(DATA_URL, {
      download: true,
      header: true,
      complete: (results) => {
        const cleaned = results.data.filter(
          (c) => c && Object.keys(c).length > 0 && c.Type?.toLowerCase() === "cat"
        );
        setCats(cleaned);
        setLoading(false);
      },
    });
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        <p>Loading adoption insights...</p>
      </div>
    );

  // Adoption Speed
  const adoptionSpeedData = Object.entries(
    cats.reduce((acc, c) => {
      const speed = c.AdoptionSpeed?.trim();
      if (speed && speed.toLowerCase() !== "unknown" && speed !== "") {
        acc[speed] = (acc[speed] || 0) + 1;
      }
      return acc;
    }, {})
  )
    .map(([AdoptionSpeed, Count]) => ({ AdoptionSpeed, Count }))
    .sort((a, b) => a.AdoptionSpeed - b.AdoptionSpeed);

  // Intake Reasons
  const intakeReasonData = Object.entries(
    cats.reduce((acc, c) => {
      const reason = c.IntakeReason?.trim();
      if (reason && reason.toLowerCase() !== "unknown" && reason !== "") {
        acc[reason] = (acc[reason] || 0) + 1;
      }
      return acc;
    }, {})
  )
    .map(([IntakeReason, Count]) => ({ IntakeReason, Count }))
    .sort((a, b) => b.Count - a.Count)
    .slice(0, 10);

  // Age Group
  const ageGroupData = Object.entries(
    cats.reduce((acc, c) => {
      const age = Number(c.Age || 0);
      let group = "Unknown";
      if (age < 6) group = "Kitten (0–6 mo)";
      else if (age < 24) group = "Young (6–24 mo)";
      else if (age < 72) group = "Adult (2–6 yr)";
      else group = "Senior (6+ yr)";
      acc[group] = (acc[group] || 0) + (Number(c.Adoption_Status?.trim()) === 1 ? 1 : 0);
      return acc;
    }, {})
  ).map(([AgeGroup, Adopted]) => ({ AgeGroup, Adopted }));

  // Breed Trends
  const breedTrendData = Object.entries(
    cats.reduce((acc, c) => {
      const breed = c.Breed?.trim();
      if (breed && breed.toLowerCase() !== "unknown" && breed !== "") {
        acc[breed] = (acc[breed] || 0) + 1;
      }
      return acc;
    }, {})
  )
    .map(([Breed, Count]) => ({ Breed, Count }))
    .sort((a, b) => b.Count - a.Count)
    .slice(0, 10);

  // Color Trends
  const colorTrendData = Object.entries(
    cats.reduce((acc, c) => {
      const color = c.Color?.trim();
      if (color && color.toLowerCase() !== "unknown" && color !== "") {
        acc[color] = (acc[color] || 0) + 1;
      }
      return acc;
    }, {})
  )
    .map(([Color, Count]) => ({ Color, Count }))
    .sort((a, b) => b.Count - a.Count)
    .slice(0, 10);

  const lilac = "#d4b1f2";

  return (
    <div className="bg-gradient-to-b from-pink-50 to-white min-h-screen p-8 font-[Poppins] text-gray-800">
      <h1 className="text-4xl font-extrabold text-center text-pink-500 mb-10">
        🐾 Foster Cat Adoption Insights Dashboard
      </h1>

      {/* Adoption Speed */}
      <ChartSection
          title="⏱️ Adoption Speed Distribution"
          caption="Most cats are adopted within 30 days, but some wait over 60."
          sidebar={<AdoptionSpeedLegend />}   // <- new!
        >
          <BarChartTemplate
            data={adoptionSpeedData}
            xKey="AdoptionSpeed"
            yKey="Count"
            color="#d4b1f2"
          />
        </ChartSection>


      {/* Intake Reasons */}
      <ChartSection
        title="🏠 Top 10 Intake Reasons"
        caption="Stray and owner surrender remain the leading causes of intake."
      >
        <BarChartTemplate
          data={intakeReasonData}
          xKey="Count"
          yKey="IntakeReason"
          layout="vertical"
          color={lilac}
        />
      </ChartSection>

      {/* Age Group */}
      <ChartSection
        title="🐈 Adoption Rate by Age Group"
        caption="Kittens are adopted at nearly double the rate of senior cats."
      >
        <BarChartTemplate data={ageGroupData} xKey="AgeGroup" yKey="Adopted" color={lilac} />
      </ChartSection>

      {/* Breed */}
      <ChartSection
        title="🐾 Top 10 Adopted Breeds"
        caption="Domestic short-haired breeds dominate shelter adoptions."
      >
        <BarChartTemplate
          data={breedTrendData}
          xKey="Count"
          yKey="Breed"
          layout="vertical"
          color={lilac}
        />
      </ChartSection>

      {/* Color */}
      <ChartSection
        title="🎨 Color Trends in Adoptions"
        caption="Black cats, despite superstition, are adopted the most frequently."
      >
        <BarChartTemplate data={colorTrendData} xKey="Color" yKey="Count" color={lilac} />
      </ChartSection>
    </div>
  );
}

// Chart Section Wrapper
function ChartSection({ title, caption, children, sidebar = null }) {
  return (
    <motion.div
      className="bg-white p-6 rounded-xl shadow-md border border-pink-100 mb-10"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl font-semibold mb-4 text-pink-600">{title}</h2>

      {/* Two-column layout: 3/4 chart, 1/4 legend */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: sidebar ? "3fr 1fr" : "1fr" }}
      >
        {/* Left: Chart */}
        <div className="flex justify-center items-center w-full">
          <div
            style={{
              width: "90%",        // slightly wider to compensate for YAxis label space
              height: 300,
              marginLeft: "-40px", // visually shifts the entire chart left
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              {children}
            </ResponsiveContainer>
          </div>
        </div>


        {/* Right: Legend (optional) */}
        {sidebar && (
          <div className="flex items-center justify-center">
            <div
              className="rounded-lg border"
              style={{
                background: "rgba(250, 244, 255, 0.8)",
                borderColor: "#f0c2e9",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                padding: "12px 16px",
                fontSize: "14px",
                color: "#4b5563",
                lineHeight: 1.6,
                borderRadius: "12px",
                maxWidth: "200px", // ⬅️ makes box narrower
                minHeight: "180px", // ⬅️ keeps height compact
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {sidebar}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center mt-4">
        <p
          className="text-base font-medium text-pink-600 bg-pink-50 rounded-lg py-2 px-6 text-center shadow-sm"
          style={{
            display: "inline-block",
            maxWidth: "80%",
            lineHeight: 1.6,
          }}
        >
          💡 {caption}
        </p>
      </div>
    </motion.div>
  );
}

// 🧩 Generic Bar Chart Template
function BarChartTemplate({ data, xKey, yKey, layout = "horizontal", color }) {
  return (
    <BarChart
      data={data}
      layout={layout}
      margin={{
        top: 10,
        right: 30,
        left: layout === "vertical" ? 120 : 40,
        bottom: 10,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      {layout === "horizontal" ? (
        <>
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12, fill: "#374151" }}
            tickLine={false}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={60}
          />
          <YAxis />
        </>
      ) : (
        <>
          <XAxis type="number" />
          <YAxis
            dataKey={yKey}
            type="category"
            width={200}
            tick={{ fontSize: 13, fill: "#374151" }}
            tickLine={false}
            interval={0}
          />
        </>
      )}
      <Tooltip />
      <Bar dataKey={layout === "horizontal" ? yKey : xKey} fill={color} />
    </BarChart>
  );
}
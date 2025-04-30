// index.js
import express from "express";
import { config } from "dotenv";
import { connectDB } from "./db.js";
import { getCompetitors } from "./helpers/competitors.js";
import { extractCompanies } from "./helpers/extractCompanies.js";
import { getRelatedCompanies } from "./helpers/sonar.js";
import { get_related } from "./helpers/relation.js";
import { fetchCompetitorInsights } from "./helpers/insights.js";
import { mergeVendors } from "./helpers/mergeVendors.js";
import { summariseInsights } from "./helpers/summarizeInsights.js";
import cors from "cors";
config();
import path from "path";
const dist = path.resolve("spy-ui", "dist");

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/api/prompts", async (_req, res) => {
  try {
    const db = await connectDB();
    if (!db) {
      console.error("DB connection failed");
      return res.status(500).json({ error: "DB connection failed" });
    }
    const rows = await db
      .collection("prompts")
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed to fetch" });
  }
});

app.post("/api/analyze", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt is required" });

  try {
    const { client_company, target_company } = await extractCompanies(prompt);
    const competitors = await getCompetitors(
      client_company,
      30
      //   prompt
    );
    let externalVendors = [];
    try {
      externalVendors = await getRelatedCompanies(
        target_company,
        100,
        "sonar-pro"
        // prompt
      );
      console.log("Sonar-Pro response:", externalVendors);
    } catch (e) {
      console.error("Sonar-Pro fetch failed", e);
    }
    if (!externalVendors.length) {
      console.warn("No external vendors found");
    }

    const { directCompetitors, relatedVendors } = await get_related(
      client_company,
      competitors,
      externalVendors
    );
    console.log(
      "Direct matches:",
      directCompetitors,
      "Related matches:",
      relatedVendors
    );
    const insights = await fetchCompetitorInsights({
      client: client_company,
      target: target_company,
      direct: directCompetitors,
      related: relatedVendors,
      external: externalVendors,
      originalPrompt: prompt,
      maxCompanies: 25,
    });

    console.log(insights);
    const execSummary = await summariseInsights(
      insights,
      client_company,
      target_company
    );

    const db = await connectDB();
    const { insertedId } = await db.collection("prompts").insertOne({
      prompt,
      client_company,
      target_company,
      competitors,
      externalVendors,
      directCompetitors,
      relatedVendors,
      insights,
      createdAt: new Date(),
    });

    /* ---- 3: respond ---- */
    res.json({
      id: insertedId,
      execSummary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal failure" });
  }
});
app.use(express.static(dist));
app.get("*", (_, res) => res.sendFile(path.join(dist, "index.html")));
/* --------------- boot the server --------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 API listening on http://localhost:${PORT}`)
);

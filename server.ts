import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("interventions.db");
db.pragma('foreign_keys = ON');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS interventions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    period_id INTEGER NOT NULL,
    object TEXT NOT NULL,
    intervention_date TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (period_id) REFERENCES periods(id)
  );
`);

// Seed Data if empty
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", "admin123");
  db.prepare("INSERT INTO categories (title) VALUES (?)").run("Maintenance");
  db.prepare("INSERT INTO categories (title) VALUES (?)").run("Repair");
  db.prepare("INSERT INTO categories (title) VALUES (?)").run("Installation");
  db.prepare("INSERT INTO periods (title) VALUES (?)").run("Morning");
  db.prepare("INSERT INTO periods (title) VALUES (?)").run("Afternoon");
  db.prepare("INSERT INTO periods (title) VALUES (?)").run("Evening");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, username FROM users").all();
    res.json(users);
  });

  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.post("/api/categories", (req, res) => {
    const { title } = req.body;
    console.log("POST /api/categories", title);
    try {
      const result = db.prepare("INSERT INTO categories (title) VALUES (?)").run(title);
      res.json({ id: result.lastInsertRowid });
    } catch (error: any) {
      console.error("Error in POST /api/categories", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/categories/:id", (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    db.prepare("UPDATE categories SET title = ? WHERE id = ?").run(title, id);
    res.json({ success: true });
  });

  app.delete("/api/categories/:id", (req, res) => {
    const { id } = req.params;
    // Check if category is used in interventions
    const count = db.prepare("SELECT count(*) as count FROM interventions WHERE category_id = ?").get(id) as { count: number };
    if (count.count > 0) {
      return res.status(400).json({ error: "Cannot delete category used in interventions" });
    }
    db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/periods", (req, res) => {
    const periods = db.prepare("SELECT * FROM periods").all();
    res.json(periods);
  });

  app.post("/api/periods", (req, res) => {
    const { title } = req.body;
    console.log("POST /api/periods", title);
    try {
      const result = db.prepare("INSERT INTO periods (title) VALUES (?)").run(title);
      res.json({ id: result.lastInsertRowid });
    } catch (error: any) {
      console.error("Error in POST /api/periods", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/periods/:id", (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    db.prepare("UPDATE periods SET title = ? WHERE id = ?").run(title, id);
    res.json({ success: true });
  });

  app.delete("/api/periods/:id", (req, res) => {
    const { id } = req.params;
    // Check if period is used in interventions
    const count = db.prepare("SELECT count(*) as count FROM interventions WHERE period_id = ?").get(id) as { count: number };
    if (count.count > 0) {
      return res.status(400).json({ error: "Cannot delete period used in interventions" });
    }
    db.prepare("DELETE FROM periods WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/interventions", (req, res) => {
    const interventions = db.prepare(`
      SELECT 
        i.*, 
        u.username as user_name, 
        c.title as category_title, 
        p.title as period_title 
      FROM interventions i
      JOIN users u ON i.user_id = u.id
      JOIN categories c ON i.category_id = c.id
      JOIN periods p ON i.period_id = p.id
      ORDER BY i.intervention_date DESC
    `).all();
    res.json(interventions);
  });

  app.post("/api/interventions", (req, res) => {
    const { user_id, category_id, period_id, object, intervention_date } = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO interventions (user_id, category_id, period_id, object, intervention_date)
        VALUES (?, ?, ?, ?, ?)
      `).run(user_id, category_id, period_id, object, intervention_date);
      res.json({ id: result.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/interventions/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM interventions WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

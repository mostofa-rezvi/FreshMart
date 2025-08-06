import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./prisma";

dotenv.config();

async function main() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(cors());
  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("FreshMart API is running!");
  });

  app.get("/users", async (req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

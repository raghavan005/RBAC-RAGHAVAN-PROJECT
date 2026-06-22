import "dotenv/config";
import { connectDB } from "./config/db";
import { app } from "./app";

const PORT = parseInt(process.env.PORT ?? "5000", 10);

function startServer(port: number) {
  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Swagger docs at http://localhost:${port}/api/docs`);
  });
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`Port ${port} in use, retrying on ${port + 1}…`);
      startServer(port + 1);
    } else {
      throw err;
    }
  });
}

connectDB().then(() => startServer(PORT));

export { app };

import { Hono } from 'hono';
import { cors } from "hono/cors";
import chartRoute from "./chart";
import synthesizeRoute from "./synthesize";

const app = new Hono();

app.use("*", cors({ origin: "*" }));
app.get('/api/ping', (c) => c.json({ message: `Pong! ${Date.now()}` }));

// Mount routes
app.route("/", chartRoute);
app.route("/", synthesizeRoute);

export default app;

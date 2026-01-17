import dotenv from "dotenv";
import { createHTTPServer } from "@leanmcp/core";

// Load environment variables
dotenv.config();

// Services are automatically discovered from ./mcp directory
await createHTTPServer({
  name: "washedmcp",
  version: "1.0.0",
  port: 3001,
  cors: true,
  logging: true
});

console.log("\nwashedmcp MCP Server");

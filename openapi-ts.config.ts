import { defineConfig } from "@hey-api/openapi-ts";

// Generates a typed client from the learniverse-api OpenAPI schema.
// Run: ./scripts/gen-api.sh  (never edit src/lib/api by hand)
export default defineConfig({
  input: process.env.OPENAPI_INPUT ?? "http://localhost:8000/openapi.json",
  output: "src/lib/api",
});

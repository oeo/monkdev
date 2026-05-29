import { test, expect, spyOn, afterEach } from "bun:test";
import braveSearchCmd from "../src/tools/brave-search";

afterEach(() => {
  // Restore fetch after each test
  spyOn(globalThis, "fetch").mockRestore();
});

test("brave-search exits if BRAVE_API_KEY is missing", async () => {
  // Mock Bun.file so it doesn't accidentally find the real .env file in the global fallback
  const originalBunFile = Bun.file;
  Bun.file = (() => { throw new Error("File not found") }) as any;

  const originalEnv = process.env.BRAVE_API_KEY;
  delete process.env.BRAVE_API_KEY;

  // We spy on console.error and process.exit to verify behavior without crashing the test runner
  const exitSpy = spyOn(process, "exit").mockImplementation((() => {}) as any);
  const errorSpy = spyOn(console, "error").mockImplementation(() => {});

  // Mock args payload
  await braveSearchCmd.run({
    args: { query: "test", count: "10", json: true },
    cmd: braveSearchCmd as any,
    data: {},
  });

  expect(errorSpy).toHaveBeenCalledWith("Missing BRAVE_API_KEY in env or .env file");
  expect(exitSpy).toHaveBeenCalledWith(1);

  if (originalEnv) {
    process.env.BRAVE_API_KEY = originalEnv;
  }
  Bun.file = originalBunFile;
});

test("brave-search executes successfully with mocked fetch", async () => {
  const originalEnv = process.env.BRAVE_API_KEY;
  process.env.BRAVE_API_KEY = "test_key";

  const mockResponse = {
    web: {
      results: [
        { title: "Test Title", url: "https://test.com", description: "Test Desc" },
      ],
    },
  };

  const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  );
  
  const logSpy = spyOn(console, "log").mockImplementation(() => {});

  await braveSearchCmd.run({
    args: { query: "test query", count: "5", json: true },
    cmd: braveSearchCmd as any,
    data: {},
  });

  expect(fetchSpy).toHaveBeenCalled();
  const calledUrl = fetchSpy.mock.calls[0][0] as URL;
  expect(calledUrl.toString()).toContain("q=test+query");
  expect(calledUrl.toString()).toContain("count=5");

  // Output should be JSON since we passed json: true
  expect(logSpy).toHaveBeenCalled();
  const output = JSON.parse(logSpy.mock.calls[0][0]);
  expect(output.query).toBe("test query");
  expect(output.results[0].title).toBe("Test Title");

  if (originalEnv === undefined) {
    delete process.env.BRAVE_API_KEY;
  } else {
    process.env.BRAVE_API_KEY = originalEnv;
  }
});

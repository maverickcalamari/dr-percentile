import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { DIAGNOSTIC_SKILLS, skillById } from "@/lib/curriculum";

describe("Classroom entry points", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

  it.each([
    ["/", "/"],
    ["/dashboard", "/dashboard"],
    ["/path", "/path"],
    ["/lesson/mul-facts", "/lesson/$skillId"],
    ["/lesson/div-facts", "/lesson/$skillId"],
    ["/diagnostic", "/diagnostic"],
    ["/auth", "/auth"],
    ["/guardian", "/guardian"],
    ["/ask", "/ask"],
    ["/api/tutor", "/api/tutor"],
  ])("matches %s to %s", (path, expected) => {
    const match = router.matchRoutes(path).at(-1);
    expect(match?.routeId).not.toBe(rootRouteId);
    expect(match?.routeId).toBe(expected);
  });

  it("has a usable question generator for every diagnostic topic", () => {
    for (const id of DIAGNOSTIC_SKILLS) {
      expect(skillById(id)?.generate().prompt).toBeTruthy();
    }
  });
});
import { describe, expect, test } from "vitest";

import { isAllowedGoogleProfile } from "./auth-domain";

describe("isAllowedGoogleProfile", () => {
  test("accetta solo hd del dominio e email verificata", () => {
    expect(
      isAllowedGoogleProfile(
        { email_verified: true, hd: "basketsanvincenzo.it" },
        "basketsanvincenzo.it",
      ),
    ).toBe(true);
  });

  test("rifiuta hd diverso, non verificato, o dominio assente", () => {
    expect(
      isAllowedGoogleProfile(
        { email_verified: true, hd: "altro.example" },
        "basketsanvincenzo.it",
      ),
    ).toBe(false);
    expect(
      isAllowedGoogleProfile(
        { email_verified: false, hd: "basketsanvincenzo.it" },
        "basketsanvincenzo.it",
      ),
    ).toBe(false);
    expect(
      isAllowedGoogleProfile(
        { email_verified: true, hd: "basketsanvincenzo.it" },
        "",
      ),
    ).toBe(false);
    expect(
      isAllowedGoogleProfile(
        { email_verified: true, hd: "basketsanvincenzo.it" },
        undefined,
      ),
    ).toBe(false);
    expect(isAllowedGoogleProfile(null, "basketsanvincenzo.it")).toBe(false);
  });
});

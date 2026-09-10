import { describe, expect, test } from "vitest";

import { isAllowedGoogleProfile } from "./auth-domain";

describe("isAllowedGoogleProfile", () => {
  test("accetta hd del dominio e email verificata", () => {
    expect(
      isAllowedGoogleProfile(
        { email_verified: true, hd: "basketsanvincenzo.it" },
        "basketsanvincenzo.it",
      ),
    ).toBe(true);
  });

  test("accetta email verificata del dominio se hd manca", () => {
    expect(
      isAllowedGoogleProfile(
        {
          email: "alessandro@basketsanvincenzo.it",
          emailVerified: true,
        },
        "basketsanvincenzo.it",
      ),
    ).toBe(true);
  });

  test("accetta il dominio anche se l'env ha virgolette o spazi", () => {
    expect(
      isAllowedGoogleProfile(
        { email_verified: true, hd: "basketsanvincenzo.it" },
        ' "basketsanvincenzo.it" ',
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
        { email: "alessandro@gmail.com", email_verified: true },
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

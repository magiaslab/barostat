import { describe, expect, test } from "vitest";

import { claimsFromIdToken, isAllowedGoogleProfile } from "./auth-domain";

describe("isAllowedGoogleProfile", () => {
  test("accetta un'email del dominio anche senza hd né flag verified", () => {
    expect(
      isAllowedGoogleProfile(
        { email: "a.cipriani@basketsanvincenzo.it" },
        "basketsanvincenzo.it",
      ),
    ).toBe(true);
  });

  test("accetta hd del dominio se l'email manca", () => {
    expect(
      isAllowedGoogleProfile(
        { email_verified: true, hd: "basketsanvincenzo.it" },
        "basketsanvincenzo.it",
      ),
    ).toBe(true);
  });

  test("accetta il dominio anche se l'env ha virgolette o spazi", () => {
    expect(
      isAllowedGoogleProfile(
        { email: "a.cipriani@basketsanvincenzo.it" },
        ' "basketsanvincenzo.it" ',
      ),
    ).toBe(true);
  });

  test("rifiuta hd diverso, non verificato, gmail o dominio assente", () => {
    expect(
      isAllowedGoogleProfile(
        { email_verified: true, hd: "altro.example" },
        "basketsanvincenzo.it",
      ),
    ).toBe(false);
    expect(
      isAllowedGoogleProfile(
        {
          email: "a.cipriani@basketsanvincenzo.it",
          email_verified: false,
        },
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
        { email: "a.cipriani@basketsanvincenzo.it" },
        "",
      ),
    ).toBe(false);
    expect(
      isAllowedGoogleProfile(
        { email: "a.cipriani@basketsanvincenzo.it" },
        undefined,
      ),
    ).toBe(false);
    expect(isAllowedGoogleProfile(null, "basketsanvincenzo.it")).toBe(false);
  });
});

describe("claimsFromIdToken", () => {
  test("legge email e hd dal payload, ignora token malformati", () => {
    const payload = btoa(
      JSON.stringify({
        email: "a.cipriani@basketsanvincenzo.it",
        email_verified: true,
        hd: "basketsanvincenzo.it",
      }),
    );
    expect(claimsFromIdToken(`aaa.${payload}.bbb`)).toMatchObject({
      email: "a.cipriani@basketsanvincenzo.it",
      email_verified: true,
      hd: "basketsanvincenzo.it",
    });
    expect(claimsFromIdToken("not-a-jwt")).toEqual({});
    expect(claimsFromIdToken(undefined)).toEqual({});
  });
});

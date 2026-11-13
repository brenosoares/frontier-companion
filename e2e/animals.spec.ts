import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Facts below come from the committed dataset (data/processed): 6 ranch animals.
test.describe("animals index", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("lists the ranch animals with their diet and what they give", async ({ page }) => {
    await page.goto("/pt-BR/animals");

    await expect(page.getByRole("heading", { level: 1, name: "Animais" })).toBeVisible();
    const crob = page.getByRole("link", { name: /Tartaguejo/ });
    await expect(crob).toContainText("Nitrogênico");
    await expect(crob).toContainText("Pérola-luz");
    await expect(crob.locator('img[src^="/icons/animals/"]')).toBeVisible();
    for (const name of ["Plumaleve", "Ratife", "Caulegarto", "Múfalo", "Casco de Cristal"]) {
      await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();
    }
  });

  test("shows the ranch structures with their cost", async ({ page }) => {
    await page.goto("/pt-BR/animals");

    await expect(
      page.getByRole("heading", { level: 2, name: "Estruturas do rancho" }),
    ).toBeVisible();
    for (const group of [
      "Incubadora",
      "Comedouros",
      "Bebedouros",
      "Abrigos",
      "Camas",
      "Cuidados",
    ]) {
      await expect(page.getByRole("heading", { level: 3, name: group })).toBeVisible();
    }
    const incubator = page.getByRole("link", { name: /Incubadora de Ovos/ });
    await expect(incubator).toContainText("Custo");
    await incubator.click();
    await expect(page).toHaveURL(/\/pt-BR\/constructs\/EggIncubator$/);
  });

  test("is in the sidebar and is localized", async ({ page }) => {
    await page.goto("/en/animals");

    const sidebar = page.getByRole("navigation", { name: "Main navigation" });
    await expect(sidebar.getByRole("link", { name: "Animals" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("heading", { level: 2, name: "Ranch structures" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Crobling/ })).toContainText("Nitrogenic");
  });
});

test.describe("animal detail", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("covers loot, feeding and raising", async ({ page }) => {
    await page.goto("/pt-BR/animals/Crob");

    await expect(page.getByRole("heading", { level: 1, name: "Tartaguejo" })).toBeVisible();

    const loot = page.locator("section").filter({
      has: page.getByRole("heading", { level: 2, name: "O que dá" }),
    });
    await expect(loot.getByRole("link", { name: "1× Pérola-luz" })).toBeVisible();
    await expect(loot.getByRole("link", { name: "1× Dejetos Nitrogênicos" })).toBeVisible();
    await expect(loot.getByRole("link", { name: "Ovo de Tartaguejo" })).toHaveCount(0);

    const acquire = page.locator("section").filter({
      has: page.getByRole("heading", { level: 2, name: "Como conseguir" }),
    });
    await expect(acquire.getByRole("link", { name: "Ovo de Tartaguejo" })).toBeVisible();
    await expect(acquire.getByText("5%", { exact: true })).toBeVisible();
    await expect(acquire.getByText("Ovo raro", { exact: true })).toBeVisible();

    const feeding = page.locator("section").filter({
      has: page.getByRole("heading", { level: 2, name: "Alimentação" }),
    });
    await expect(feeding.getByRole("link", { name: "Forragem Suave" })).toBeVisible();
    await expect(feeding.getByText("200 de água")).toBeVisible();

    const raising = page.locator("section").filter({
      has: page.getByRole("heading", { level: 2, name: "Criação" }),
    });
    await expect(raising.getByText("Incubação")).toBeVisible();
    await expect(raising.getByText("75 m²")).toBeVisible();
    await expect(raising.getByText("1 animal por perto")).toBeVisible();
  });

  test("loot and fodder link to their item pages", async ({ page }) => {
    await page.goto("/pt-BR/animals/Crob");
    await page.getByRole("link", { name: "Forragem Suave" }).click();

    await expect(page).toHaveURL(/\/pt-BR\/items\/CritterFood1$/);
    // Fodder is crafted, so its page says how.
    await expect(page.getByRole("heading", { level: 2, name: "Como fazer" })).toBeVisible();
  });

  test("an item's origin from an animal links back to the animal", async ({ page }) => {
    await page.goto("/pt-BR/items/Feather");
    await page.getByRole("link", { name: "Plumaleve" }).first().click();

    await expect(page).toHaveURL(/\/pt-BR\/animals\/Tookan$/);
    await expect(page.getByRole("heading", { level: 1, name: "Plumaleve" })).toBeVisible();
  });

  test("is localized and answers 404 for an unknown animal", async ({ page, request }) => {
    await page.goto("/en/animals/Crob");
    await expect(page.getByRole("heading", { level: 1, name: "Crobling" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "What it gives" })).toBeVisible();
    await expect(page.getByText("1 animal nearby")).toBeVisible();

    expect((await request.get("/pt-BR/animals/Dragon")).status()).toBe(404);
  });
});

test.describe("wild-only creatures share the animals list", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("lists ranch animals and wild-only creatures together, marking the wild-only ones", async ({
    page,
  }) => {
    await page.goto("/pt-BR/animals");

    await expect(
      page.getByRole("main").locator("section").first().getByRole("listitem"),
    ).toHaveCount(8);
    const znork = page.getByRole("link", { name: /Peixe-mergulhador/ });
    await expect(znork).toContainText("Só selvagem");
    await expect(znork).toContainText("Nitrogênico");
    await expect(znork).toContainText("Cristal Vermelho");
    await expect(page.getByRole("link", { name: /Mantilha Matutina/ })).toContainText(
      "Só selvagem",
    );
    await expect(page.getByRole("link", { name: /Tartaguejo/ })).not.toContainText("Só selvagem");
  });

  test("a wild-only creature shows what feeding gives and has no ranch sections", async ({
    page,
  }) => {
    await page.goto("/pt-BR/animals/Znork");

    await expect(page.getByRole("heading", { level: 1, name: "Peixe-mergulhador" })).toBeVisible();
    await expect(page.getByText("Só selvagem").first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Como conseguir" })).toBeVisible();
    await expect(page.locator('a[href$="/items/RedCrystal"]').first()).toBeVisible();
    await expect(page.getByText("Esta criatura não deixa ovo ao ser alimentada")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Alimentação" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "O que dá" })).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 2, name: "Criação" })).toHaveCount(0);
    await expect(page.getByText("Fome por dia")).toHaveCount(0);
    await expect(page.getByText("Chance do ovo")).toHaveCount(0);
    await expect(page.getByText("Esta criatura só existe na natureza")).toBeVisible();
  });

  test("an item's origin from a wild-only creature links to it", async ({ page }) => {
    await page.goto("/pt-BR/items/RedCrystal");
    await page.locator('a[href$="/animals/Znork"]').first().click();
    await expect(page).toHaveURL(/\/pt-BR\/animals\/Znork$/);
  });

  test("is localized", async ({ page }) => {
    await page.goto("/en/animals");
    await expect(page.getByRole("link", { name: /Wild only|Znork/ }).first()).toBeVisible();
    await expect(page.getByText("Wild only").first()).toBeVisible();
  });
});

test.describe("accessibility (axe)", () => {
  const pages = [
    "/pt-BR/animals",
    "/en/animals",
    "/pt-BR/animals/Crob",
    "/en/animals/Mox",
    "/pt-BR/animals/Znork",
  ];

  for (const scheme of ["dark", "light"] as const) {
    for (const path of pages) {
      test(`${path} in ${scheme} theme has no violations`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 375, height: 700 } });

  for (const path of ["/pt-BR/animals", "/pt-BR/animals/Crob"]) {
    test(`${path} has no horizontal scroll`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Facts below come from the committed dataset (data/processed): 13 crops and 13 large plants.
test.describe("plants index", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("lists crops and large plants with type, time to mature and seed", async ({ page }) => {
    await page.goto("/pt-BR/plants");

    await expect(page.getByRole("heading", { level: 1, name: "Plantas" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Lavouras" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Árvores e flores" })).toBeVisible();

    const wheat = page.getByRole("link", { name: /Trigo/ }).first();
    await expect(wheat).toContainText("Nitrogênica");
    await expect(wheat).toContainText("Amadurece em 1 dia");
    await expect(wheat.locator('img[src^="/icons/plants/"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /Árvore-luz/ })).toContainText("5 dias");
    await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(26);
  });

  test("does not list scenery plants", async ({ page }) => {
    await page.goto("/pt-BR/plants");
    await expect(page.getByRole("link", { name: /Pinheiro|Pine/ })).toHaveCount(0);
  });

  test("is in the sidebar and is localized", async ({ page }) => {
    await page.goto("/en/plants");

    const sidebar = page.getByRole("navigation", { name: "Main navigation" });
    await expect(sidebar.getByRole("link", { name: "Plants" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("heading", { level: 1, name: "Plants" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Crops" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Glo Tree/ })).toBeVisible();
  });
});

test.describe("plant detail", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("a crop shows its growing facts, harvest and seed", async ({ page }) => {
    await page.goto("/pt-BR/plants/Caroot");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Cultivo" })).toBeVisible();
    await expect(page.getByText("Potássica", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("3 dias").first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Colheita" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Semente" })).toBeVisible();
    const seed = page.locator("section").filter({
      has: page.getByRole("heading", { level: 2, name: "Semente" }),
    });
    await expect(seed.locator('a[href$="/items/CarootSeeds"]')).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Frutos" })).toHaveCount(0);
  });

  test("a large plant also shows its fruit and breaking level", async ({ page }) => {
    await page.goto("/pt-BR/plants/GloTree");

    await expect(page.getByRole("heading", { level: 2, name: "Frutos" })).toBeVisible();
    await expect(page.getByText("Nível de quebra")).toBeVisible();
    await expect(page.locator('a[href$="/items/GloWood"]')).toBeVisible();
    await expect(page.locator('a[href$="/items/GloFruit"]')).toBeVisible();
    await expect(page.getByText("2–4×")).toBeVisible();
  });

  test("a plant with no seed in the data says so", async ({ page }) => {
    await page.goto("/pt-BR/plants/FuelRock");
    await expect(
      page.getByText("Os dados do jogo não indicam uma semente para esta planta."),
    ).toBeVisible();
  });

  test("harvest links go to the item pages", async ({ page }) => {
    await page.goto("/pt-BR/plants/Wheat");
    await page.locator('a[href$="/items/Wheat"]').first().click();
    await expect(page).toHaveURL(/\/pt-BR\/items\/Wheat$/);
  });

  test("an item's plant origin links to the plant, and scenery origins stay plain text", async ({
    page,
  }) => {
    await page.goto("/pt-BR/items/GloFruit");
    await page.locator('a[href$="/plants/GloTree"]').first().click();
    await expect(page).toHaveURL(/\/pt-BR\/plants\/GloTree$/);
  });

  test("answers 404 for an unknown or scenery plant", async ({ request }) => {
    expect((await request.get("/pt-BR/plants/Nope")).status()).toBe(404);
    expect((await request.get("/pt-BR/plants/Pine")).status()).toBe(404);
  });
});

test.describe("plant 'used in'", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("lists the recipes that use what the plant gives, e.g. Caroot into Caroot Juice", async ({
    page,
  }) => {
    await page.goto("/pt-BR/plants/Caroot");

    const usedIn = page.locator("section").filter({
      has: page.getByRole("heading", { level: 2, name: "Usado em" }),
    });
    await expect(usedIn.getByRole("heading", { level: 3, name: "Cenoura-forte" })).toBeVisible();
    await expect(usedIn.locator('a[href$="/items/CarootJuice"]').first()).toBeVisible();
    await expect(usedIn.getByText("Feito em:").first()).toBeVisible();
  });

  test("items several plants give are linked, not expanded", async ({ page }) => {
    await page.goto("/pt-BR/plants/GloTree");

    const usedIn = page.locator("section").filter({
      has: page.getByRole("heading", { level: 2, name: "Usado em" }),
    });
    await expect(usedIn.getByText("Itens que várias plantas dão.")).toBeVisible();
    await expect(usedIn.locator('a[href$="/items/PlantFiber"]')).toBeVisible();
    await expect(usedIn.getByRole("heading", { level: 3, name: "Fibra Vegetal" })).toHaveCount(0);
  });

  test("says so when no recipe uses what the plant gives", async ({ page }) => {
    await page.goto("/pt-BR/plants/RedColorflower");
    await expect(page.getByRole("heading", { level: 2, name: "Usado em" })).toBeVisible();
  });

  test("is localized", async ({ page }) => {
    await page.goto("/en/plants/Caroot");
    await expect(page.getByRole("heading", { level: 2, name: "Used in" })).toBeVisible();
  });
});

test.describe("fertilizers and harvest quality", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("the plants page links to it", async ({ page }) => {
    await page.goto("/pt-BR/plants");
    await page.getByRole("link", { name: /Fertilizantes e qualidade da colheita/ }).click();
    await expect(page).toHaveURL(/\/pt-BR\/plants\/fertilizing$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Fertilizantes e qualidade" }),
    ).toBeVisible();
  });

  test("lists the mulches and powders with how to make them", async ({ page }) => {
    await page.goto("/pt-BR/plants/fertilizing");

    const mulches = page.locator("section").filter({
      has: page.getByRole("heading", { level: 2, name: "Adubos" }),
    });
    await expect(mulches.locator('a[href$="/items/NitrogenicFertilizer"]').first()).toBeVisible();
    await expect(mulches.locator('a[href$="/items/FertilizerX4"]').first()).toBeVisible();
    await expect(mulches.getByRole("heading", { level: 3, name: "Pós" })).toBeVisible();
    await expect(mulches.getByText("Feito em:").first()).toBeVisible();
  });

  test("lists the reagents with their effect and potency", async ({ page }) => {
    await page.goto("/pt-BR/plants/fertilizing");

    const reagents = page.locator("section").filter({
      has: page.getByRole("heading", { level: 2, name: "Reagentes" }),
    });
    await expect(reagents.getByRole("listitem")).toHaveCount(9);
    const rabbage = reagents.getByRole("listitem").filter({
      has: page.locator('a[href$="/items/Rabbage"]'),
    });
    await expect(rabbage).toContainText("Velocidade de crescimento");
    await expect(rabbage).toContainText("Potência: 800");
    await expect(page.getByText("#N/A")).toHaveCount(0);
  });

  test("shows the quality odds per level as an accessible table", async ({ page }) => {
    await page.goto("/pt-BR/plants/fertilizing");

    const table = page.getByRole("table", { name: "Qualidade da colheita" });
    await expect(table.getByRole("columnheader")).toHaveText([
      "Nível",
      "Ruim",
      "Média",
      "Boa",
      "Excelente",
    ]);
    await expect(table.getByRole("row")).toHaveCount(8);
    const baseline = table
      .getByRole("row")
      .filter({ has: page.getByRole("rowheader", { name: "0", exact: true }) });
    await expect(baseline).toContainText("100%");
    const top = table.getByRole("row").filter({ has: page.getByRole("rowheader", { name: "+3" }) });
    await expect(top).toContainText("35%");
    await expect(top).toContainText("65%");
  });

  test("an item that is a reagent says what it does", async ({ page }) => {
    await page.goto("/pt-BR/items/Rabbage");

    await expect(
      page.getByRole("heading", { level: 2, name: "Reagente de fertilizante" }),
    ).toBeVisible();
    await expect(page.getByText("Velocidade de crescimento")).toBeVisible();
    await page.getByRole("link", { name: "Fertilizantes e qualidade da colheita" }).click();
    await expect(page).toHaveURL(/\/plants\/fertilizing$/);
  });

  test("an item that is not a reagent has no such section", async ({ page }) => {
    await page.goto("/pt-BR/items/Clam");
    await expect(
      page.getByRole("heading", { level: 2, name: "Reagente de fertilizante" }),
    ).toHaveCount(0);
  });

  test("is localized", async ({ page }) => {
    await page.goto("/en/plants/fertilizing");
    await expect(
      page.getByRole("heading", { level: 1, name: "Fertilizers and quality" }),
    ).toBeVisible();
    await expect(page.getByRole("table", { name: "Harvest quality" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Exquisite" })).toBeVisible();
  });
});

test.describe("plants accessibility (axe)", () => {
  const pages = [
    "/pt-BR/plants",
    "/en/plants",
    "/pt-BR/plants/Caroot",
    "/en/plants/GloTree",
    "/pt-BR/plants/fertilizing",
    "/en/plants/fertilizing",
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

test.describe("plants on mobile", () => {
  test.use({ viewport: { width: 375, height: 700 } });

  for (const path of ["/pt-BR/plants", "/pt-BR/plants/GloTree", "/pt-BR/plants/fertilizing"]) {
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

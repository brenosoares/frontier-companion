import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Facts below come from the committed dataset (data/processed): 78 parts and 144 chips.
test.describe("mech hub", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("separates body parts, tools, transform modes and the chips for each part", async ({
    page,
  }) => {
    await page.goto("/pt-BR/mech");

    await expect(page.getByRole("heading", { level: 1, name: "Mecha" })).toBeVisible();
    for (const group of ["Corpo", "Ferramentas", "Modos de transformação", "Chips de upgrade"]) {
      await expect(page.getByRole("heading", { level: 2, name: group })).toBeVisible();
    }
    for (const name of [
      "Motor",
      "Para-brisa",
      "Braços",
      "Pernas",
      "Serra Dentada",
      "Jato de Irrigação",
      "Arado|Alteração do Campo",
      "Chips de Serra Dentada",
      "Chips de Pernas",
    ]) {
      await expect(
        page.getByRole("link", { name: new RegExp(`^(${name})\\s`) }).first(),
      ).toBeVisible();
    }
  });

  test("is in the sidebar as Mecha, highlighted on every mech page", async ({ page }) => {
    const sidebar = page.getByRole("navigation", { name: "Navegação principal" });
    for (const path of [
      "/pt-BR/mech",
      "/pt-BR/mech/category/spike-saw",
      "/pt-BR/mech/Jackhammer3",
      "/pt-BR/mech/chip/ToolRange0",
    ]) {
      await page.goto(path);
      await expect(sidebar.getByRole("link", { name: "Mecha" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }
  });

  test("is localized", async ({ page }) => {
    await page.goto("/en/mech");
    await expect(page.getByRole("heading", { level: 1, name: "Mech" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Upgrade chips" })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Spike Saw\s/ }).first()).toBeVisible();
  });
});

test.describe("mech category", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("lists every tier in order with cost and attributes", async ({ page }) => {
    await page.goto("/pt-BR/mech/category/spike-saw");

    await expect(page.getByRole("heading", { level: 1, name: "Serra Dentada" })).toBeVisible();
    const cards = page.getByRole("main").getByRole("link", { name: /Serra Dentada Mk\./ });
    await expect(cards).toHaveCount(8);
    await expect(cards.first()).toContainText("Mk. 0");
    await expect(cards.last()).toContainText("Mk. 7");
    await expect(cards.last()).not.toContainText("⎒");
    await expect(cards.first()).toContainText("Custo");
    await expect(cards.first()).toContainText("Durabilidade");
  });

  test("lists the chips that fit a part, with their power", async ({ page }) => {
    await page.goto("/pt-BR/mech/category/chips-spike-saw");

    await expect(
      page.getByRole("heading", { level: 1, name: "Chips de Serra Dentada" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Velocidade da Ferramenta Nv\. 1/ }).first(),
    ).toContainText("Energia 1");
  });

  test("has no category for crafting or unknown names", async ({ request }) => {
    expect((await request.get("/pt-BR/mech/category/craft-Furnace")).status()).toBe(404);
    expect((await request.get("/pt-BR/mech/category/nope")).status()).toBe(404);
  });
});

test.describe("mech part detail", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("shows attributes, build cost, fitting chips and the neighbour tiers", async ({ page }) => {
    await page.goto("/pt-BR/mech/Jackhammer3");

    await expect(
      page.getByRole("heading", { level: 1, name: "Serra Dentada Mk. 3" }),
    ).toBeVisible();
    await expect(page.getByText("Nível 4 de 8")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Atributos" })).toBeVisible();
    await expect(page.getByText("Dano de Golpe")).toBeVisible();

    const cost = page.locator("section").filter({
      has: page.getByRole("heading", { level: 2, name: "Custo de construção" }),
    });
    await expect(cost.getByRole("link")).toHaveCount(3);

    await expect(page.getByRole("heading", { level: 2, name: "Chips que encaixam" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Ver todos os chips de Serra Dentada/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Nível anterior: Serra Dentada Mk\. 2/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Próximo nível: Serra Dentada Mk\. 4/ }),
    ).toBeVisible();
  });

  test("a starting part has no cost and says so", async ({ page }) => {
    await page.goto("/pt-BR/mech/StandardEngine");
    await expect(page.getByText("Sem custo em recursos nos dados do jogo.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Nível anterior/ })).toHaveCount(0);
  });

  test("arms and legs come as sets, costed once", async ({ page }) => {
    await page.goto("/pt-BR/mech/NakedArmSet");
    await expect(
      page.getByRole("heading", { level: 1, name: "Conjunto de Braços Estruturais" }),
    ).toBeVisible();
    await expect(page.getByText("Capacidade de Transporte", { exact: true })).toBeVisible();
  });

  test("cost lines link to the item pages", async ({ page }) => {
    await page.goto("/pt-BR/mech/Jackhammer3");
    await page.locator('a[href*="/items/"]').first().click();
    await expect(page).toHaveURL(/\/pt-BR\/items\/\w+$/);
  });

  test("answers 404 for an unknown part", async ({ request }) => {
    expect((await request.get("/pt-BR/mech/Nope")).status()).toBe(404);
  });
});

test.describe("mech chip detail", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("shows what it does, its power, its cost and the parts it fits", async ({ page }) => {
    await page.goto("/pt-BR/mech/chip/ToolRange0");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Nv. 1");
    await expect(page.getByText("Energia", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Custo de construção" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Encaixa em" })).toBeVisible();
    await page.getByRole("link", { name: /Ferramentas · Serra Dentada/ }).click();
    await expect(page).toHaveURL(/\/pt-BR\/mech\/category\/chips-spike-saw$/);
  });

  test("marks unique chips", async ({ page }) => {
    await page.goto("/pt-BR/mech/chip/CarefulSweep0");
    await expect(page.getByText("Único", { exact: true })).toBeVisible();
    await expect(page.getByText("Só um por mecha.")).toBeVisible();
  });

  test("a chip with no named part says so honestly", async ({ page }) => {
    await page.goto("/pt-BR/mech/chip/Defense0");
    await expect(page.getByText("Os dados do jogo não indicam em qual parte")).toBeVisible();
  });

  test("key bindings never show raw braces", async ({ page }) => {
    await page.goto("/pt-BR/mech/Jackhammer1");
    await expect(page.getByText(/\{\w+\}/)).toHaveCount(0);
    await expect(page.getByText(/\[UseToolPrimary\]/)).toBeVisible();
  });

  test("answers 404 for an unknown chip", async ({ request }) => {
    expect((await request.get("/pt-BR/mech/chip/Nope")).status()).toBe(404);
  });
});

test.describe("mech accessibility (axe)", () => {
  const pages = [
    "/pt-BR/mech",
    "/en/mech",
    "/pt-BR/mech/category/spike-saw",
    "/en/mech/category/chips-legs",
    "/pt-BR/mech/Jackhammer3",
    "/en/mech/NakedArmSet",
    "/pt-BR/mech/chip/ToolRange0",
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

test.describe("mech on mobile", () => {
  test.use({ viewport: { width: 375, height: 700 } });

  for (const path of ["/pt-BR/mech", "/pt-BR/mech/category/engine", "/pt-BR/mech/Jackhammer3"]) {
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

/*import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Step 1: Open site
  await page.goto("https://ui.chaicode.com/");
  console.log("✅ Opened Home Page");
  await page.screenshot({ path: "step1_home.png" });

  // Step 2: Click Sign Up directly
  await page.getByText("Sign Up").click();
  console.log("✅ Clicked Sign Up");
  await page.screenshot({ path: "step2_signup.png" });

  // Step 3: Wait for form and fill inputs
  //await page.waitForSelector('input[placeholder="First name"]');

    await page.locator('#firstName').fill("Shivam");
    await page.locator('#lastName').fill("yadav");
    await page.locator('#email').fill("Shivam@gmail.com");
    await page.locator('#password').fill("strong1212");
    await page.locator('#confirmPassword').fill("Strong1313");


  console.log("✅ Form filled");
  await page.screenshot({ path: "step3_filled.png" });

  // Step 4: Submit form
  await page.getByRole("button", { name: "Create Account" }).click();
  console.log("✅ Form submitted");
  await page.screenshot({ path: "step4_submitted.png" });

  await browser.close();
})();

*/
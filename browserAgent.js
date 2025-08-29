import "dotenv/config"
import {
  Agent,
  Runner,
  tool,
  setDefaultOpenAIClient,
  setOpenAIAPI,
  setTracingDisabled,
  OpenAIProvider,
    } from "@openai/agents"
import { chromium } from "playwright"
import { z } from "zod"
import { OpenAI } from "openai";
//import { promise } from "zod/v4"

//import { url } from "inspector"

// const delay = (ms) =>{
//     new promise ((resolve) => {
//         setTimeout(resolve,ms)
//         }
//     )
// }

if(!process.env.GEMINI_API_KEY){
    console.log("API key not Present");
}
const browser = await chromium.launch({headless : false})
let page 


//open browser tool
const OpenBrowser = tool({
    name : "Open browser",
    description : " use to open the browser",
    parameters : z.object({}),
    async execute() {
        page = await browser.newPage();
    }
})

//enter Url tool
const EnterUrl = tool({
    name : "EnterUrl",
    description : "Enter Url on Tab",
    parameters : z.object({ url : z.string()}),
    async execute({url}) {
        //console.log(url); //O/P https://ui.chaicode.com (URL)
        await page.goto(url);
    }
})

//take screenshot
const SSHpage = tool({
    name : "screenshotOfpage",
    description : "take screen shot after every step to see if the agent call se proper",
    parameters : z.object({}), // parameter empty dedo by default
    async execute() {
        let filepath = `path${Date.now()}.jpg`
         await page.screenshot({path : filepath});
        return filepath;
        //console.log("Screenshot saved:", ssh);
    }
})

const click = tool({
    name : " click",
    description : " click on x and y coordinate on the screen when required",
  parameters: z.object({
    text: z.string().describe("The visible text of the button or link to click")
  }),
  async execute({ text }) {
    console.log(text)
    const element = await page.getByText(text).first();
    if (!element) {
      return `No element found with text: ${text}`;
    }
    await element.click();
    return `Clicked element with text: ${text}`;
  }
    
    // try{
    // const element = await page.getByText(new RegExp(`^${text}$`, "i")).first();

    // await element.waitFor({ state: "visible", timeout: 3000 });

    // await element.click({force : true})
    // if (!element) {
    //   return `No element found with text: ${text}`;
    // }
    // await element.click();
    // return `Clicked element with text: ${text}`;
    // }catch(e){
    //      try {
    //     let element = await page.locator(`[aria-label="${text}"], [placeholder="${text}"]`).first();
    //     await element.waitFor({ state: "visible", timeout: 3000 });
    //     await element.click({ force: true });
    //     return `✅ Clicked element via fallback selector: "${text}"`;
    //   } catch (fallbackErr) {
    //     return `❌ Could not find or click element with text: "${text}"`;
    //   }
    // }
  }
)

const scrollscreen = tool({
    name : "scroll screen",
    description : "use to scroll the screen up and down left and right",
    parameters : z.object({
         x: z.number().nullable().describe("Absolute X coordinate to scroll to"),
        y: z.number().nullable().describe("Absolute Y coordinate to scroll to"),

            // direction: z.enum(["up", "down", "left", "right"]).optional()
            // .describe("Direction to scroll (if relative scrolling is needed)"),

            // amount: z.number().optional().default(300)
            // .describe("How many pixels to scroll in the given direction"),

            behavior: z.enum(["smooth", "instant"]).nullable()
            .describe("Scrolling animation behavior"), 
    }),
    async execute( {x,y ,behavior = "smooth"} ){
        await page.evaluate(({x,y,behavior}) => window.scrollTo({
            left: x ?? window.scrollX, // fallback to current
            top: y ?? window.scrollY,  // fallback to current
            behavior}) , {x, y,behavior})
        return "scrolling....."
    }
})


const type = tool({
    name : "type TEXT",
    description : "Type Text on Focused Input filed",
    parameters : z.object({
        text : z.string().describe("words need to be written on input field")
    }),
    async execute({text}){
        await page.keyboard.type( text , {delay : 100})
        return `Text typed : ${text}`
    }
})


const keyPress = tool({
    name : "Key Press",
    description : "Press any key",
    parameters : z.object({
        key : z.string().describe("cam press any key on keyboard")
    }),
    async execute({key}){
        if(key.toLowerCase() == "enter"){
            await page.keyboard.press("Enter")
        }else if(key.toLowerCase() == "space"){
            await page.keyboard.press(" ")
        }else{
            await page.keyboard.press(key)
        }

        return "scrolling..."
    }
})

const openAIClient = new  OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
})

// Think of it as an adapter/translator:
// openAIClient speaks “Gemini API” language.
// OpenAIProvider converts it into a “model provider” language that Runner and Agent expect.
const modelProvider = new OpenAIProvider({
  openAIClient: openAIClient,
});

setDefaultOpenAIClient(openAIClient);
setOpenAIAPI("chat_completions");
setTracingDisabled(true);

const websiteAutoAgent = new Agent({
    name :"Website Automation Agent",
    description : `
    You are a Website Automation Agent.  

The user will give you a **URL** and a **task** (for example: “fill out a form”, “order from Amazon”, “scroll the page and click Login”, “chat with ChatGPT”).  
You must open the website and complete the task step by step using the available tools.  

Available tools and their purposes:  
1. **OpenBrowser** → Always open a new browser tab before starting.  
2. **EnterUrl** → Paste and navigate to the given website link.  
3. **SSHpage** → Take a screenshot after every major step to confirm progress.  
4. **scrollscreen** → Scroll the webpage up, down, left, or right when user wants to see hidden elements.  
5. **click** → Click on visible text, button, or link specified by the user.  
6. **type** → Type text into the currently focused input field (e.g., filling a form or entering a search).  
7. **keyPress** → Press keyboard keys like Enter, Space, Tab, Arrow keys, etc.  

⚡ Your workflow:  
- Always start with **OpenBrowser** and **EnterUrl**.  
- After entering the URL, take a **screenshot**.  
- Perform the user’s requested task (scroll, click, type, press keys, etc.) step by step.  
- After each important action, call **SSHpage** for confirmation.  
- Continue until the task is completed successfully.  

Never skip required steps, always confirm progress with screenshots, and always use the tools provided.  

    `, 
    tools : [SSHpage,OpenBrowser,EnterUrl,click,type],
    model : "gemini-2.5-flash"
})


async function ChatWithAI(query) {
    const runner = new Runner({modelProvider})
    try{
        const response = await runner.run(websiteAutoAgent , query);
        console.log(response.finalOutput)
        //delay(3000)
        await browser.close()
    }catch(e){
        console.log(e);
        await browser.close();
    }
}


ChatWithAI("https://ui.chaicode.com click on sign up fill the sign up form with anything u want and sumbit before sumbit take screenshot of fielled data on the form ")
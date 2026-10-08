# Playwright Practice against WebDriverUniversity

Playwright + TypeScript practice project, written against [WebDriverUniversity](https://webdriveruniversity.com). Not production tests, just for learning.

## Covered pages
AI Playground, Autocomplete TextField, Contact Us, Dropdowns/Checkboxes/Radio Buttons, Page Object Model, Popup & Alerts, To-Do List.

## Setup
```bash
npm install
npx playwright install
```

## Run
```bash
npx playwright test             
npx playwright test --headed    
npx playwright test --ui        
npx playwright show-report     
```

Specs live in `e2e/`. The site URL is set once as `baseURL` in `playwright.config.ts` and can be overridden with `BASE_URL`.

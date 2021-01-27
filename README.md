# Commons Variables Impact
A Next.js webapp that visually displays the the variables each section of Commons depends on to display.

## Getting Started
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## TODOs

Add dockerfile so that Charles can publish
Change origin back to MFJ and push

Add confidence column
Add Measure Count and Filter Count columns for each variable (e.g. number of measures the variable is used in)

Group main section into 3 columns: Monthly Data | Explorer View | Annual Measures & Filters 

Allow each measure block to be expanded individually as well as entire section

Display dependent variables separate from primary variables in each measure block

Handle @ variables like  @TotDrgHybridCrts in - 118	Performance, Companion: 18	Drug Courts

Live updating:
 - Get it to read the google sheet directly or 
 - A move variable status to Clubhouse and have it read from there
 - When clubhouse integration is in place, have each variable link to their corresponding clubhouse ticket.

filterSubclasses may have variables that depend on other variables.

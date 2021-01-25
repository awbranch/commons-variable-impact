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

show / hide details - would display all the text in each data block.

filterSubclasses may have variables that depend on other variables.
Handle @ variables like  @TotDrgHybridCrts in - 118	Performance, Companion: 18	Drug Courts
Add explore view measures section (by measure group)

Add more columns to the checkboxes: Status, Missing, Priority
Allow sorting of each column

Initialize checkboxes with those already done variables as a starting place
Within each group
   Add the measure id: name
   Add list all variables mark missing bold or with background dark?
Publish it to gihub pages
Get it to read the googlesheet directly alternatily local excel sheet

Checkboxes add
   Sort/Group: Alpha, Priority (from Variable Progress)


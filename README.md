# AI Model Insights

Build a production-quality web application called "ModelPulse".

I am attaching:

1. A scraped JSON dataset from TokenCost containing AI model pricing and metadata.

2. Screenshots of an existing ModelPulse design that should be used as visual reference.

IMPORTANT:

The attached JSON is the SOURCE OF TRUTH for model data.

Do not invent, hallucinate, or hardcode model data.

Do not clone TokenCost's UI or branding.

==================================================

PRODUCT

==================================================

Name:

ModelPulse

Subtitle:

AI MODEL INTELLIGENCE

Tagline:

"Find the right AI model for your workload — not just the cheapest one."

ModelPulse transforms scraped AI model pricing data into actionable model-selection intelligence.

The product should help developers answer:

"Which AI model should I use for my workload and budget?"

==================================================

TECH STACK

==================================================

Use:

- React

- TypeScript

- Vite

- Tailwind CSS

- Lucide icons

- Recharts or another lightweight chart library

Keep the application componentized and production-ready.

Use the attached JSON as a local data source initially.

Create a centralized data service so the JSON source can later be replaced by a Bright Data API without rewriting the UI.

==================================================

DESIGN

==================================================

Create a premium developer-focused AI SaaS interface.

Visual direction:

- dark black background

- purple/violet accent

- subtle purple gradients

- white typography

- muted gray secondary text

- glass-like cards

- thin borders

- subtle grid/noise background

- tasteful glow

- modern typography

- smooth hover transitions

Use the attached ModelPulse screenshots as the primary visual reference.

Do not blindly copy the screenshots.

Improve spacing, responsiveness and usability while preserving the overall visual identity.

The result must look like a real startup product, not an AI-generated dashboard template.

==================================================

NAVIGATION

==================================================

Create:

Dashboard

Explorer

Compare

Calculator

Analytics

Use proper client-side routing.

Navigation must actually work.

==================================================

DASHBOARD

==================================================

Hero:

"Find the right AI model for your workload — not just the cheapest one."

Description:

"Compare pricing, context, quality and performance across AI models to choose the model that fits your workload and budget."

Buttons:

"Explore all models"

"Estimate monthly cost"

Show dynamically calculated KPI cards:

- Models Tracked

- Average Input Price

- Highest Quality

- Cheapest Model

Do not hardcode these values.

Calculate them from the JSON.

Add:

"Best Value Models"

Display:

Model

Provider

Input

Output

Context

Speed

Quality

Value

Add badges such as:

Best Value

Lowest Cost

Fastest

Highest Quality

Only show badges when supported by actual data.

==================================================

EXPLORER

==================================================

Build a powerful model discovery interface.

Features:

Search

Provider filter

Price filter

Quality filter

Context filter

Sorting:

- Cheapest

- Highest Quality

- Best Value

- Fastest

- Largest Context

Table columns:

Model

Provider

Input

Output

Context

Max Output

Speed

Quality

Value

Add pagination.

Clicking a model opens a detailed model page/modal.

Show every available field from the JSON.

Missing values must display:

"N/A"

Never fabricate missing values.

==================================================

COMPARE

==================================================

Allow users to select up to 4 models.

Create a premium side-by-side comparison.

Compare:

- Provider

- Input price

- Output price

- Context

- Max output

- Speed

- Quality

- Value

- Estimated workload cost

Highlight:

BEST PRICE

BEST QUALITY

BEST SPEED

BEST VALUE

LARGEST CONTEXT

Calculate these dynamically.

==================================================

CALCULATOR

==================================================

This is a core feature.

Create a workload cost calculator.

Inputs:

Monthly input tokens

Monthly output tokens

Number of requests

Monthly budget

Minimum quality requirement

Allow selecting a model.

Calculate:

Input cost

Output cost

Total monthly cost

Formula:

input cost =

monthly input tokens / 1,000,000 × input price

output cost =

monthly output tokens / 1,000,000 × output price

total =

input cost + output cost

Handle missing/non-numeric prices safely.

Never treat an unavailable price as zero.

For values such as "<$0.01", preserve the original display and mark the calculated estimate as approximate/unavailable if a reliable numeric calculation cannot be made.

==================================================

MODEL RECOMMENDATION

==================================================

Create a "Find My Best Model" experience.

User provides:

- workload type

- monthly input tokens

- monthly output tokens

- maximum budget

- minimum quality

- optional minimum context

- optional speed preference

Then rank suitable models using ONLY available dataset fields.

Return:

Recommended Model

Estimated Monthly Cost

Why it was selected

Cheaper Alternatives

Quality/Cost tradeoff

Example:

"Model X is the best fit for your workload."

"Estimated monthly cost: $12.40"

"31% cheaper than the next suitable model."

Only make claims when supported by actual calculations.

==================================================

MODEL PULSE VALUE SCORE

==================================================

Create a transparent:

"ModelPulse Value Score"

This is OUR derived metric and must NOT be presented as an official benchmark.

Prefer the existing "value" field from the dataset when available.

If calculating a new score, use available fields such as:

- quality

- speed

- input price

- output price

- value

Explain the calculation in a small "How is this calculated?" tooltip/modal.

Never fabricate quality or benchmark values.

==================================================

ANALYTICS

==================================================

Create a visually impressive analytics dashboard.

Charts:

- Input price distribution

- Output price distribution

- Provider distribution

- Quality vs price

- Speed vs price

- Value distribution

- Context window distribution

Add insight cards:

Most Affordable

Highest Quality

Best Value

Fastest

Largest Context

All charts must be calculated from the attached JSON.

Never fabricate chart data.

==================================================

DATA ARCHITECTURE

==================================================

Create:

src/data/models.json

Create TypeScript types/interfaces for the dataset.

Create a data service:

getModels()

getModelById()

getProviders()

getStatistics()

Normalize the scraped JSON safely.

Handle:

null

missing fields

empty strings

pricing strings

duplicate models

special price displays

Do not silently convert unavailable values to zero.

==================================================

BRIGHT DATA

==================================================

The original dataset was obtained using Bright Data Scraper Studio.

For now, use the attached JSON locally.

Do NOT create fake Bright Data API calls.

Do NOT add fake API keys.

Do NOT falsely claim that the frontend is connected to a live Bright Data API.

You may display:

"Data sourced via Bright Data Scraper Studio"

If showing:

"Live via Bright Data"

make it visually clear that this is a data-source indicator and not a live API connection unless an actual API integration is configured.

Architect the data service so a future Bright Data Collector/API can replace models.json easily.

==================================================

DATA PIPELINE SECTION

==================================================

Add a small polished section on Dashboard:

TokenCost

↓

Bright Data Scraper

↓

Structured Model Data

↓

ModelPulse

↓

Model Recommendation

Explain:

"Bright Data handles reliable web data extraction. ModelPulse turns that data into actionable model-selection intelligence."

==================================================

RESPONSIVENESS

==================================================

Desktop:

full dashboard

Tablet:

responsive cards and tables

Mobile:

stack cards

horizontal table scrolling

mobile-friendly filters

responsive navigation

No accidental horizontal overflow.

==================================================

UX

==================================================

Add:

- loading states

- empty states

- error states

- tooltips

- hover states

- active navigation

- smooth transitions

- accessible controls

- keyboard-friendly interactions

Do not use excessive animations.

Every visible button must perform a real action.

No placeholder lorem ipsum.

==================================================

IMPORTANT RULES

==================================================

1. Do not clone TokenCost.

2. Do not copy TokenCost branding.

3. Do not invent model data.

4. Do not fabricate metrics.

5. Use attached JSON as the source of truth.

6. Calculate dashboard statistics dynamically.

7. Make search functional.

8. Make filtering functional.

9. Make sorting functional.

10. Make comparison functional.

11. Make calculator functional.

12. Make recommendation logic functional.

13. Make analytics functional.

14. Keep components reusable.

15. Keep code clean and exportable.

16. Do not require authentication.

17. Do not require a paid backend for the initial version.

18. Do not add fake API integrations.

19. Do not leave non-functional buttons.

20. Prioritize a polished finished product over unnecessary features.

==================================================

FINAL GOAL

==================================================

The final product must communicate within 10 seconds:

"We collect AI model data from the web and turn it into actionable intelligence that helps developers choose the right model for their workload."

Build the complete ModelPulse application now.

Before finishing:

- run the build

- fix all TypeScript errors

- fix all JSX errors

- fix broken routes

- verify all major interactions

- ensure the application starts successfully

- ensure there are no console-breaking errors

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/00f24f99-c5e2-4326-9533-7006f6ea3a8b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

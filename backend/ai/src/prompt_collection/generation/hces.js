// hces section-wise generation prompts

const goalhces = `Goal:
Capture reliable data on:
consumption, income, assets, living conditions, digital usage, welfare access`

// SECTION 1 — IDENTIFICATION fixed
// auto capture
// - household ID (phone/Aadhaar/internal)
// - location (state/district/GPS)
// - rural/urban
// - survey status

// SECTION 2 — Household Composition
const b2 = `Generate questions for: Household Composition

Must include questions for:
* total number of people in the household
* number of earning members
* age distribution:
  * children (0-14)
  * adults (15-59)
  * elderly (60+)

Ensure:
* questions do NOT require listing every member
* answers allow understanding of dependency in the household

Also include (if relevant):
* whether any member lives away for work/study
* whether household has students or elderly dependents

Generate 3-5 questions maximum.`

// SECTION 3 — Economic Profile
const b3 = `Generate questions for: Economic Profile

Must include questions for:
* main source of household income (job, business, labour, farming, etc.)
* short description of main work (open-ended)

Ensure:
* answers help classify occupation and type of income
* avoid asking exact income amount

Add follow-up questions based on type of work:
* salaried → job type and stability
* business/self-employed → type of activity
* agriculture → farming/livestock type
* labour/gig → frequency and regularity of work

Generate 3-6 questions maximum.`

// SECTION 4 — Living Conditions
const b4 = `Generate questions for: Living Conditions

Must include questions for:
* type of house (owned, rented, other)
* primary cooking fuel
* main source of drinking water
* toilet/latrine access

Ensure:
* options reflect common Indian conditions
* answers indicate basic living standards

Also include (if relevant):
* availability issues (water shortage, electricity hours)
* housing quality (basic type/material)

Generate 3-5 questions maximum.`

// SECTION 5 — Food Consumption
const b5 = `Generate questions for: Food Consumption

Must include questions for:
* approximate monthly food expenditure (use ranges)
* frequency of eating outside/ordering in
* whether household uses ration/PDS
* main source of food (home grown, purchase, mixed)

Ensure:
* questions estimate consumption without detailed item lists
* avoid long recall or item-wise questions

Also include (if relevant):
* 1-2 simple questions about daily food habits or dietary diversity

Generate 4-6 questions maximum.`

// SECTION 6 — Non-Food Consumption (Health, Education & Utilities)
const b6 = `Generate questions for: Non-Food Consumption and Major Expenses

Must include questions for:
* approximate monthly expenditure on utilities (electricity, water, fuel)
* major expenses on health and medicine (routine vs unexpected)
* education expenditure (school fees, books)
* transport and travel expenses

Ensure:
* capture scale of expenditures without exact accounting
* separate routine monthly vs occasional large expenses

Also include (if relevant):
* recent large expenses (clothing, footwear)

Generate 4-6 questions maximum.`

// SECTION 7 — Digital and Modern Consumption
const b7 = `Generate questions for: Digital and Modern Consumption

Must include questions for:
* online shopping frequency
* use of digital payments (UPI/cards)
* device access (smartphone/basic phone/laptop/none)

Ensure:
* distinguish between occasional and regular usage

Also include (if relevant):
* app usage (shopping, food delivery)
* subscriptions (OTT/services)

Generate 3-5 questions maximum.`

// SECTION 8 — Asset Ownership
const b8 = `Generate questions for: Household Assets and Durables

Must include questions for:
* ownership of key transport assets (bicycle, 2-wheeler, car)
* ownership of home appliances (fridge, washing machine, AC/cooler)
* ownership of electronic goods (TV, computer/laptop)

Ensure:
* capture standard of living indicator assets
* avoid asking for brands or exact values

Also include (if relevant):
* recent significant asset purchases (last 1 year)

Generate 3-5 questions maximum.`

// SECTION 9 — Government Benefits
const b9 = `Generate questions for: Government Benefits and Financial Inclusion

Must include questions for:
* whether household has a ration card or similar access
* whether household receives any direct government benefits (cash transfers, housing, etc.)
* access to banking or credit facilities (bank account, loans)

Ensure:
* responses indicate welfare coverage and financial security

Also include (if relevant):
* awareness of major schemes
* reason for not receiving benefits if eligible

Generate 3-5 questions maximum.`

const hces = [b2, b3, b4, b5, b6, b7, b8, b9]

export { goalhces, hces }
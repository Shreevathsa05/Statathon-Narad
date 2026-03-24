// asi block-wise generation prompts

// goal
const goalasi = `Goal:
Capture reliable data on:

enterprise profile, assets and capital, operations and expenses, workforce and production`
// BLOCK A — IDENTIFICATION (OFFICIAL) fixed
// auto capture
// - industry code (NIC)
// - state/district codes
// - survey IDs (DSL, PSL)
// - sector (rural/urban)

// BLOCK B — Enterprise Profile
const bB = `Generate questions for: Enterprise Profile

Must include questions for:
* name and location of business (city, district, state)
* type of organization (proprietorship, company, etc.)
* year of starting operations
* number of months business operated in last year
* whether business has foreign ownership (yes/no)
* whether business has R&D activities (yes/no)

Ensure:
* captures identity and operational status of enterprise
* avoids excessive legal/technical wording

Also include (if relevant):
* certifications (ISO, etc.)
* contact details

Generate 4-6 questions maximum.`

// BLOCK C — Fixed Assets
const bC = `Generate questions for: Fixed Assets

Must include questions for:
* whether business owns key assets:
  * land
  * buildings
  * plant & machinery
  * transport equipment
  * computers/software
* approximate value range of total assets

Ensure:
* avoid detailed accounting tables
* capture asset scale using ranges (low/medium/high)

Also include (if relevant):
* recent investments or additions in assets
* disposal/sale of assets

Generate 3-5 questions maximum.`

// BLOCK D — Working Capital & Loans
const bD = `Generate questions for: Working Capital and Loans

Must include questions for:
* whether business maintains inventory (yes/no)
* approximate level of inventory (low/medium/high)
* availability of cash or bank balance
* whether business has loans or credit

Ensure:
* capture liquidity and financial position
* avoid detailed balance sheet format

Also include (if relevant):
* type of loans (bank, informal, etc.)
* repayment pressure

Generate 3-5 questions maximum.`

// BLOCK E — Employment & Labour
const bE = `Generate questions for: Employment and Labour

Must include questions for:
* total number of workers
* approximate split:
  * male/female
  * permanent/contract
* number of working days in a year

Ensure:
* capture workforce size and structure
* avoid manday-level complexity

Also include (if relevant):
* wage payment type (daily/monthly)
* benefits (bonus, PF, etc.)

Generate 4-6 questions maximum.`

// BLOCK F — Expenses
const bF = `Generate questions for: Business Expenses

Must include questions for:
* major expense categories:
  * raw materials
  * energy/fuel
  * rent
  * maintenance
  * interest payments
* approximate total expenditure (range)

Ensure:
* capture cost structure without detailed accounting

Also include (if relevant):
* biggest expense category

Generate 3-5 questions maximum.`

// BLOCK G — Output / Revenue
const bG = `Generate questions for: Revenue and Output

Must include questions for:
* main products/services produced
* approximate annual sales/revenue (range)
* whether business sells directly or via intermediaries

Ensure:
* capture output scale and nature

Also include (if relevant):
* export share
* seasonal variation

Generate 3-5 questions maximum.`

// BLOCK H/I — Inputs (Materials & Energy)
const bHI = `Generate questions for: Inputs and Consumption

Must include questions for:
* main raw materials used
* source of materials (local/imported)
* energy usage (electricity, fuel types)

Ensure:
* capture production inputs without item-level coding

Also include (if relevant):
* supply constraints
* energy shortages

Generate 3-5 questions maximum.`

// BLOCK J — Products
const bJ = `Generate questions for: Products and Production

Must include questions for:
* main products manufactured
* approximate quantity or scale of production
* whether production increased or decreased

Ensure:
* capture production output trends

Also include (if relevant):
* by-products or secondary products

Generate 3-5 questions maximum.`

// BLOCK K — ICT Usage
const bK = `Generate questions for: ICT Usage

Must include questions for:
* use of computers (yes/no)
* internet usage (yes/no)
* online business activities (orders, sales)

Ensure:
* capture digital adoption level

Also include (if relevant):
* type of internet connection
* software usage

Generate 3-5 questions maximum.`

// BLOCK L — Energy Conservation
const bL = `Generate questions for: Energy Practices

Must include questions for:
* whether any energy-saving measures are used
* type of energy savings (electricity, fuel, etc.)

Ensure:
* capture sustainability practices

Also include (if relevant):
* investments in efficiency

Generate 2-4 questions maximum.`
const asi = [bB, bC, bD, bE, bF, bG, bHI, bJ, bK, bL]
export { goalasi, asi }

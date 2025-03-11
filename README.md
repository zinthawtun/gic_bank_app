# GIC Banking APP

## How to run

### 1. Install dependencies - npm i
### 2. Build - npm run build
### 3. Test - npm test
### 4. Run app - npm run start

## Dev Local Env
#### Nodejs Version - v20.18.0
#### TSC Version - Version 5.7.2

## Additional rules and validation checks added
#### 1. AccountName or RuleID is limited to 20 characters.
#### 2. Transaction dates should be going forward starting from the first transaction. Injecting with past date is not allowed.
#### 3. Interest rule can be overwritten with a different rule-id and rate on the same date. Same rule id cannot be reused for different date.
#### 4. Transaction amount limit is 1,000,000 per transaction.

## Tests Coverage

File                        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------------|---------|----------|---------|---------|-------------------
All files                   |     100 |      100 |     100 |     100 |
 src/config                 |     100 |      100 |     100 |     100 |
  constants.ts              |     100 |      100 |     100 |     100 |
 src/data-access            |     100 |      100 |     100 |     100 |
  account-da.ts             |     100 |      100 |     100 |     100 |
  interest-rule-da.ts       |     100 |      100 |     100 |     100 |
  transaction-da.ts         |     100 |      100 |     100 |     100 |
 src/handlers               |     100 |      100 |     100 |     100 |
  interest-rule-handler.ts  |     100 |      100 |     100 |     100 |
  statement-handler.ts      |     100 |      100 |     100 |     100 |
  transaction-handler.ts    |     100 |      100 |     100 |     100 |
 src/infrastructure         |     100 |      100 |     100 |     100 |
  file-service.ts           |     100 |      100 |     100 |     100 |
 src/services               |     100 |      100 |     100 |     100 |
  interest-rule-service.ts  |     100 |      100 |     100 |     100 |
  report-service.ts         |     100 |      100 |     100 |     100 |
  transaction-service.ts    |     100 |      100 |     100 |     100 |
 src/utilities              |     100 |      100 |     100 |     100 |
  result-helper.ts          |     100 |      100 |     100 |     100 |
  service-factory-helper.ts |     100 |      100 |     100 |     100 |
  validation-helper.ts      |     100 |      100 |     100 |     100 |
 test                       |     100 |      100 |     100 |     100 |
  scenario-helper.ts        |     100 |      100 |     100 |     100 |

#### For running test automation at checkout, GitHub Actions is set up.
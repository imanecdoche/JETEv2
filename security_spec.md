# Security Spec

1. Data Invariants:
- A user must have name, active, role.
- A category must have name, type.
- A transaction must have userId, type, qty, gram, price, customerName, date, timestamp.
- A dailySummary must have userId, date, totalTransactions, totalGrams, totalPrice, statsByCategory.

2. The "Dirty Dozen" Payloads
- creating a transaction without a valid userId
- updating a transaction without proper role
- etc.

3. The Test Runner
- We will use `request.auth != null` because this app uses anonymous login.

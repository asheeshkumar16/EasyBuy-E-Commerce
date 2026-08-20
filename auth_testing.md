# Auth Testing Playbook (EasyBuy)

Step 1: MongoDB Verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Verify: bcrypt hash starts with `$2b$`; indexes on users.email (unique), login_attempts.identifier, payment_transactions.session_id (unique).

Step 2: API Testing
```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"easybuy@gmail.com","password":"EasyBuy@2026"}'
cat cookies.txt
curl -b cookies.txt http://localhost:8001/api/auth/me
```
Login returns the user object and sets `access_token` + `refresh_token` httpOnly cookies. `/me` returns the same user.

Accounts:
- Admin: easybuy@gmail.com / EasyBuy@2026 (role: admin, seeded at startup)
- Test shopper: shopper@example.com / Shopper@123 (role: customer)

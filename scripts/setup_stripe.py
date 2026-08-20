import os, json, urllib.request

base = os.environ["INTEGRATION_PROXY_URL"]
job_id = "1a0cf1fb-3c28-447c-a3bd-b79fbc172f55"
key = "sk-emergent-42c94BfA6F027D8A58"

req = urllib.request.Request(
    base + "/stripe/sandboxes",
    data=json.dumps({"job_id": job_id}).encode(),
    headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(req) as r:
    sandbox = json.load(r)

print("SECRET:", sandbox["sandbox_secret_key"])
print("PUBLISHABLE:", sandbox["sandbox_publishable_key"])
print("ACCOUNT:", sandbox["sandbox_account_id"])
print("WEBHOOK:", sandbox["preview_webhook_secret"])
print("ONBOARDING:", sandbox["onboarding_url"])

import stripe
stripe.api_key = sandbox["sandbox_secret_key"]
acct = stripe.Account.retrieve()
print("COUNTRY:", acct["country"])

s = stripe.tax.Settings.retrieve()
if not (s.head_office and getattr(s.head_office, "address", None)):
    stripe.tax.Settings.modify(
        head_office={"address": {"country": "US", "line1": "1 Fashion Way", "city": "New York", "state": "NY", "postal_code": "10001"}},
        defaults={"tax_behavior": "exclusive"},
    )
    print("tax settings configured")
else:
    print("tax settings already present")

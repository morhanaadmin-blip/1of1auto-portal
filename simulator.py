#!/usr/bin/env python3
"""
1OF1AUTO Form Simulator - Automated testing for credit application
Generates 100 test applications with various data combinations
and reports validation errors.
"""

import json
import random
import string
import asyncio
import httpx
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List

# Configuration
API_ENDPOINT = "http://localhost:3001/api/submit"
TIMEOUT = 30
NUM_RUNS = 100

# Test data generators
FIRST_NAMES = ["John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Lisa"]
LAST_NAMES = ["Johnson", "Smith", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"]
MIDDLE_NAMES = ["Lee", "Marie", "James", "Anne", "Paul", "Grace", "Michael", "Elizabeth"]
EMAILS = ["@gmail.com", "@yahoo.com", "@outlook.com", "@example.com"]
HOUSING_STATUSES = ["own", "mortgage", "rent", "family", "other"]
OCCUPATIONS = ["Software Engineer", "Teacher", "Manager", "Accountant", "Sales", "Driver", "Nurse"]
EMPLOYERS = ["Tech Corp", "School District", "Manufacturing Inc", "Finance Co", "Retail Co"]
STATES = ["FL", "CA", "NY", "TX", "IL", "OH", "GA", "NC"]
BANKS = ["Chase", "Bank of America", "Wells Fargo", "TD Bank", "First National"]

def generate_phone() -> str:
    """Generate random 10-digit phone number as string"""
    return "".join([str(random.randint(0, 9)) for _ in range(10)])

def generate_ssn() -> str:
    """Generate random 9-digit SSN"""
    return "".join([str(random.randint(0, 9)) for _ in range(9)])

def generate_ein() -> str:
    """Generate random 9-digit EIN"""
    return "".join([str(random.randint(0, 9)) for _ in range(9)])

def generate_date(days_ago: int = None) -> str:
    """Generate random date in YYYY-MM-DD format"""
    if days_ago is None:
        days_ago = random.randint(365 * 18, 365 * 70)
    date = datetime.now() - timedelta(days=days_ago)
    return date.strftime("%Y-%m-%d")

def generate_person() -> dict:
    """Generate random person data"""
    return {
        "licenseFile": None,
        "licenseImage": None,
        "dlPhotoTracking": None,
        "firstName": random.choice(FIRST_NAMES),
        "middleName": random.choice(MIDDLE_NAMES),
        "lastName": random.choice(LAST_NAMES),
        "dob": generate_date(),
        "licenseNumber": "".join([random.choice(string.ascii_letters + string.digits) for _ in range(10)]),
        "licenseAddress": f"{random.randint(1, 9999)} Main St, Miami, FL 33101",
        "email": random.choice(FIRST_NAMES).lower() + random.choice(EMAILS),
        "phone": generate_phone(),
        "ssn": generate_ssn(),
        "registeringAddressSame": True if random.random() > 0.3 else False,
        "registeringAddress": f"{random.randint(1, 9999)} Oak Ave, Miami, FL 33102" if random.random() > 0.3 else "",
        "yearsAtAddress": str(random.randint(0, 40)),
        "monthsAtAddress": str(random.randint(0, 11)),
        "housingStatus": random.choice(HOUSING_STATUSES),
        "monthlyHousingPayment": str(random.randint(500, 3000)),
        "annualIncome": str(random.randint(25000, 200000)),
        "monthlyIncome": str(random.randint(2000, 16000)),
        "occupation": random.choice(OCCUPATIONS),
        "employerName": random.choice(EMPLOYERS),
        "employerStreet": f"{random.randint(1, 9999)} Business Blvd",
        "employerCity": "Miami",
        "employerState": random.choice(STATES),
        "employerZip": "".join([str(random.randint(0, 9)) for _ in range(5)]),
        "employerPhone": generate_phone(),
        "yearsWorked": str(random.randint(0, 30)),
        "monthsWorked": str(random.randint(0, 11)),
    }

def generate_business() -> dict:
    """Generate random business data"""
    return {
        "legalName": f"{random.choice(FIRST_NAMES)}'s {random.choice(EMPLOYERS)}",
        "title": "Owner",
        "ownershipPercent": str(random.randint(50, 100)),
        "ein": generate_ein(),
        "phone": generate_phone(),
        "address": f"{random.randint(1, 9999)} Commerce St",
        "suite": f"Suite {random.randint(100, 900)}",
        "poBox": "",
        "city": "Miami",
        "state": random.choice(STATES),
        "zip": "".join([str(random.randint(0, 9)) for _ in range(5)]),
        "establishedDate": generate_date(days_ago=random.randint(365, 365*20)),
        "stateOfIncorporation": "FL",
        "numEmployees": str(random.randint(1, 50)),
        "yearsInBusiness": str(random.randint(1, 20)),
        "bankName": random.choice(BANKS),
        "bankAccountNumber": "".join([str(random.randint(0, 9)) for _ in range(12)]),
        "bankContactName": random.choice(FIRST_NAMES) + " " + random.choice(LAST_NAMES),
        "bankContactPhone": generate_phone(),
    }

def generate_application(mode: str = "individual") -> dict:
    """Generate complete application"""
    app = {
        "mode": mode,
        "primary": generate_person(),
        "coApplicant": generate_person() if mode == "co-applicant" else None,
        "business": generate_business() if mode == "business" else None,
        "documents": {
            "insurance": None,
            "insuranceOptional": random.choice([True, False]),
            "registration": None,
            "registrationOptional": random.choice([True, False]),
            "utilityBill": None,
            "driverLicensePhoto": None,
            "businessLicense": None,
        },
        "agreement": {
            "signatureData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",  # 1x1 PNG
            "agreed": True,
        },
        "depositPaid": True,
        "stripeSessionId": "cs_test_" + "".join([random.choice(string.ascii_lowercase + string.digits) for _ in range(28)]),
    }
    return app

async def submit_application(client: httpx.AsyncClient, app: dict, run_num: int) -> dict:
    """Submit application and return result"""
    try:
        # Create FormData
        form_data = {
            "application": json.dumps(app)
        }

        # For simulator, we skip actual file uploads (mock with empty)
        # The API will handle null/missing files appropriately

        response = await client.post(
            API_ENDPOINT,
            data=form_data,
            timeout=TIMEOUT
        )

        result = {
            "run": run_num,
            "mode": app["mode"],
            "status_code": response.status_code,
            "success": response.status_code == 200,
            "response": None,
            "error": None,
        }

        try:
            result["response"] = response.json()
        except:
            result["response"] = response.text

        # Check for error message in response
        if not result["success"]:
            if isinstance(result["response"], dict):
                result["error"] = result["response"].get("error", "Unknown error")
            else:
                result["error"] = str(result["response"])

        return result

    except Exception as e:
        return {
            "run": run_num,
            "mode": app["mode"],
            "status_code": 0,
            "success": False,
            "response": None,
            "error": str(e),
        }

async def main():
    print("🚀 Starting 1OF1AUTO Form Simulator...")
    print(f"   API Endpoint: {API_ENDPOINT}")
    print(f"   Total Runs: {NUM_RUNS}")
    print(f"   Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Distribute test modes
    modes = ["individual"] * 35 + ["co-applicant"] * 30 + ["business"] * 35
    random.shuffle(modes)

    results = []
    errors_by_type = defaultdict(list)
    success_count = 0

    async with httpx.AsyncClient(follow_redirects=True) as client:
        # Run tests sequentially for cleaner output
        for i, mode in enumerate(modes, 1):
            app = generate_application(mode=mode)
            result = await submit_application(client, app, i)
            results.append(result)

            if result["success"]:
                success_count += 1
                print(f"✓ Run {i:3d} ({mode:12s}): SUCCESS")
            else:
                error = result["error"]
                errors_by_type[error].append(result)
                print(f"✗ Run {i:3d} ({mode:12s}): {error}")

            # Brief pause to avoid overwhelming server
            await asyncio.sleep(0.1)

    # Summary Report
    print("\n" + "="*80)
    print("SIMULATOR REPORT")
    print("="*80)
    print(f"\nTotal Runs: {NUM_RUNS}")
    print(f"✓ Successful: {success_count} ({success_count*100//NUM_RUNS}%)")
    print(f"✗ Failed: {NUM_RUNS - success_count} ({(NUM_RUNS-success_count)*100//NUM_RUNS}%)")

    if errors_by_type:
        print(f"\nError Types: {len(errors_by_type)}")
        for error_msg, error_results in sorted(errors_by_type.items(), key=lambda x: -len(x[1])):
            modes_affected = set(r["mode"] for r in error_results)
            print(f"\n  • {error_msg}")
            print(f"    Occurrences: {len(error_results)}")
            print(f"    Modes affected: {', '.join(sorted(modes_affected))}")
            print(f"    Runs: {', '.join(str(r['run']) for r in error_results[:5])}" +
                  (f", ..." if len(error_results) > 5 else ""))

    # Mode breakdown
    print(f"\nBreakdown by Mode:")
    for mode in ["individual", "co-applicant", "business"]:
        mode_results = [r for r in results if r["mode"] == mode]
        mode_success = sum(1 for r in mode_results if r["success"])
        print(f"  • {mode:12s}: {mode_success}/{len(mode_results)} success ({mode_success*100//len(mode_results)}%)")

    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    asyncio.run(main())

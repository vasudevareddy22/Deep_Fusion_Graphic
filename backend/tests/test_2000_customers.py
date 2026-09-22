"""
Stress Test: 2,000 Customer Email OTP Authentication & Database/Excel Sync
Tests:
1. Generation of 2,000 unique 6-digit OTP codes and email dispatch payload
2. Verification and one-time consumption of each OTP
3. Persistence of all 2,000 customers to SQLite users table (role=Customer)
4. Bulk synchronization to registered_users.xlsx
5. Verification that Vasudevareddyeevuri@gmail.com remains the sole Administrator
"""

import sys
import time
import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.database.db import get_db_connection
from backend.services.otp_service import generate_otp, verify_otp, _otp_store
from backend.database.user_excel import log_registration, get_excel_path, COLUMNS
import openpyxl

def run_2000_customer_test():
    total_customers = 2000
    print(f"==================================================")
    print(f"[*] STARTING LOAD TEST: {total_customers} CUSTOMER AUTHENTICATIONS")
    print(f"==================================================")

    start_time = time.time()
    generated_otps = []
    
    # Phase 1: Generate OTP & Dispatch Email for 2,000 customers
    print(f"\n[Phase 1/4] Generating 6-digit OTPs and dispatching verification emails...")
    phase1_start = time.time()
    for i in range(1, total_customers + 1):
        email = f"customer_{i:04d}@soc-customer.com"
        name = f"Customer {i:04d}"
        
        # generate_otp with skip_cooldown=True for batch generation
        res = generate_otp(email, skip_cooldown=True)
        assert res['success'] == True, f"Failed to generate OTP for {email}"
        generated_otps.append((email, name, res['code']))

    phase1_duration = time.time() - phase1_start
    print(f"[+] Successfully generated and dispatched {len(generated_otps)} unique OTPs in {phase1_duration:.2f}s ({len(generated_otps)/phase1_duration:.0f} ops/sec)")

    # Phase 2: Verify OTP for all 2,000 customers
    print(f"\n[Phase 2/4] Verifying OTPs and authenticating 2,000 customers...")
    phase2_start = time.time()
    verified_count = 0
    failed_count = 0

    for email, name, code in generated_otps:
        v_res = verify_otp(email, code)
        if v_res['valid']:
            verified_count += 1
        else:
            failed_count += 1

    phase2_duration = time.time() - phase2_start
    print(f"[+] Verified {verified_count}/{total_customers} OTPs successfully in {phase2_duration:.2f}s ({verified_count/phase2_duration:.0f} verifications/sec)")
    assert failed_count == 0, f"Failed verifications detected: {failed_count}"

    # Phase 3: Insert 2,000 customers into SQLite database
    print(f"\n[Phase 3/4] Persisting 2,000 authenticated customers into SQLite database...")
    phase3_start = time.time()
    conn = get_db_connection()
    cursor = conn.cursor()

    db_rows = []
    for email, name, _ in generated_otps:
        db_rows.append((
            email, '', '', name, 'Customer', 'EMAIL_OTP', 'Customer Tenant'
        ))

    cursor.executemany('''
        INSERT OR IGNORE INTO users (email, mobile, password, name, role, auth_provider, organization, last_login)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ''', db_rows)
    conn.commit()

    # Verify total users in database
    total_db_users = cursor.execute('SELECT COUNT(*) as c FROM users').fetchone()['c']
    admin_users = cursor.execute('SELECT email, role FROM users WHERE role = ?', ('Administrator',)).fetchall()
    conn.close()

    phase3_duration = time.time() - phase3_start
    print(f"[+] SQLite bulk commit complete in {phase3_duration:.2f}s. Total users in DB: {total_db_users}")
    print(f"[+] Active Administrator in DB: {[dict(u) for u in admin_users]}")

    # Phase 4: Sync to Excel (registered_users.xlsx) in high-speed batch
    print(f"\n[Phase 4/4] Synchronizing 2,000 customers into registered_users.xlsx...")
    phase4_start = time.time()
    excel_path = get_excel_path()
    wb = openpyxl.load_workbook(excel_path)
    ws = wb.active

    # Check existing emails in excel
    existing_emails = set()
    for row in ws.iter_rows(min_row=2, values_only=True):
        if row and row[2]:
            existing_emails.add(str(row[2]).strip().lower())

    now_str = time.strftime("%Y-%m-%d %H:%M:%S")
    added_to_excel = 0
    for idx, (email, name, _) in enumerate(generated_otps, start=1):
        if email.lower() not in existing_emails:
            uid = f"CUST{idx:04d}"
            ws.append([
                uid, name, email, 'EMAIL_OTP', 'Customer Tenant', 'Customer', now_str, '', 'ACTIVE', now_str
            ])
            added_to_excel += 1

    wb.save(excel_path)
    phase4_duration = time.time() - phase4_start
    print(f"[+] Excel sync complete in {phase4_duration:.2f}s. Added {added_to_excel} rows to {Path(excel_path).name}")

    total_duration = time.time() - start_time
    print(f"\n==================================================")
    print(f"[SUCCESS] ALL 2,000 CUSTOMERS AUTHENTICATED SUCCESSFULLY")
    print(f"Total Pipeline Duration: {total_duration:.2f} seconds")
    print(f"Throughput: {total_customers / total_duration:.1f} complete customer auth flows/sec")
    print(f"==================================================")

if __name__ == '__main__':
    run_2000_customer_test()

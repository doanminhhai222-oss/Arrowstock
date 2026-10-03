#!/usr/bin/env python3
"""Tạo mã kích hoạt Pro.
Dùng:  python3 scripts/make_license.py "Pro 1 tháng" 30 5      (tên gói, số ngày, số mã)
In ra: (1) các MÃ để gửi khách (giữ bí mật, KHÔNG commit), (2) dòng JSON chỉ chứa mã băm để dán vào js/config.js -> licenses."""
import secrets, hashlib, sys, json

plan = sys.argv[1] if len(sys.argv) > 1 else 'Pro 1 tháng'
days = int(sys.argv[2]) if len(sys.argv) > 2 else 30
n = int(sys.argv[3]) if len(sys.argv) > 3 else 1
alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
keys = ['ARROW-' + '-'.join(''.join(secrets.choice(alpha) for _ in range(4)) for _ in range(3)) for _ in range(n)]
print('MÃ GỬI KHÁCH (bí mật):')
for k in keys:
    print('  ', k)
print('\nDÁN VÀO js/config.js -> licenses:')
for k in keys:
    print('    ' + json.dumps({'h': hashlib.sha256(k.encode()).hexdigest(), 'plan': plan, 'days': days}, ensure_ascii=False) + ',')

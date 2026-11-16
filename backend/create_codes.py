"""Bir martalik promokodlar yaratish.

Ishlatish (backend papkasidan):
    python create_codes.py 10

Kodlar faqat bir marta ko'rsatiladi va bazada SHA-256 xeshi ko'rinishida saqlanadi.
"""
import secrets
import sys

from main import connect, hash_code

ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # o'xshash belgilar (0/O, 1/I) yo'q


def make_code() -> str:
    part = lambda: "".join(secrets.choice(ALPHABET) for _ in range(4))
    return f"AIFC-{part()}-{part()}"


def main():
    if len(sys.argv) != 2 or not sys.argv[1].isdigit() or int(sys.argv[1]) < 1:
        print("Ishlatish: python create_codes.py <soni>")
        sys.exit(1)
    count = int(sys.argv[1])
    codes = []
    with connect() as con:
        while len(codes) < count:
            code = make_code()
            cur = con.execute("INSERT OR IGNORE INTO promo_codes(code_hash) VALUES(?)", (hash_code(code),))
            if cur.rowcount:
                codes.append(code)
    print(f"{count} ta promokod yaratildi:")
    for c in codes:
        print(c)


if __name__ == "__main__":
    main()

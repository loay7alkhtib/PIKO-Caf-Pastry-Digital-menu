#!/usr/bin/env python3
"""
Generate SQL UPDATE statements from the Final Menu CSV file
"""

import csv
import sys

def clean_name(name):
    """Clean and normalize item names"""
    if not name:
        return ""
    return name.strip()

def main():
    csv_file = sys.argv[1] if len(sys.argv) > 1 else "Finall Menu 111.csv"
    
    print("-- SQL UPDATE statements generated from Final Menu CSV")
    print("-- Run these in Supabase SQL editor\n")
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        
        for row in reader:
            arabic_name = clean_name(row['اسم المادة'])
            turkish_name = clean_name(row['الاسم التركي'])
            english_name = clean_name(row['الاسم اللاتيني'])
            price = row['السعر'].strip()
            
            if not arabic_name or not price:
                continue
            
            # Try to match by English name first (most reliable)
            if english_name:
                safe_name = english_name.replace("'", "''")
                print(f"UPDATE items SET price = {price} WHERE names->>'en' = '{safe_name}';")
                count += 1
            # Then try Turkish name
            elif turkish_name:
                safe_name = turkish_name.replace("'", "''")
                print(f"UPDATE items SET price = {price} WHERE names->>'tr' = '{safe_name}';")
                count += 1
            # Finally try Arabic name
            elif arabic_name:
                safe_name = arabic_name.replace("'", "''")
                print(f"UPDATE items SET price = {price} WHERE names->>'ar' = '{safe_name}';")
                count += 1
        
        print(f"\n-- Total UPDATE statements: {count}")

if __name__ == '__main__':
    main()


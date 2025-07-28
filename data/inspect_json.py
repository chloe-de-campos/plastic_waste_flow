import json
import sys
import os

def inspect_data_file(file_path):
    """Inspect a JSON data file and print information about its contents"""
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        print(f"Successfully loaded JSON file: {file_path}")
        print(f"Data type: {type(data)}")
        print(f"Length/Size: {len(data)}")
        
        # Check if it's a year-based structure
        if isinstance(data, dict) and all(str(k).isdigit() for k in data.keys()):
            print("Data is organized by years:")
            
            total_flows = 0
            for year, flows in data.items():
                num_flows = len(flows)
                total_flows += num_flows
                
                # Get source and target countries
                sources = set()
                targets = set()
                for flow in flows:
                    sources.add(flow.get('source_country', 'unknown'))
                    targets.add(flow.get('target_country', 'unknown'))
                
                print(f"  Year {year}: {num_flows} flows, {len(sources)} source countries, {len(targets)} target countries")
                
                # Show a sample flow
                if num_flows > 0:
                    print(f"  Sample flow for {year}:")
                    print(f"    {json.dumps(flows[0], indent=2)}")
            
            print(f"Total flows across all years: {total_flows}")
            
        elif isinstance(data, list):
            print("Data is a list (raw UN Comtrade format)")
            print(f"Total records: {len(data)}")
            
            if len(data) > 0:
                print("Sample record:")
                print(json.dumps(data[0], indent=2))
                print("\nAvailable fields:")
                for i, field in enumerate(data[0].keys()):
                    print(f"  {i}: {field}")
                
                # Look for key fields
                key_fields = ['refYear', 'reporterISO', 'partnerISO', 'qty', 'primaryValue', 'cmdCode', 'flowDesc']
                print("\nKey field check:")
                for field in key_fields:
                    if field in data[0]:
                        print(f"  ✓ {field}: {data[0][field]}")
                    else:
                        print(f"  ✗ {field}: NOT FOUND")
        else:
            print("Data structure is not recognized.")
            if isinstance(data, dict):
                print(f"Top-level keys: {list(data.keys())}")
    
    except json.JSONDecodeError:
        print(f"Error: The file {file_path} is not valid JSON.")
    except FileNotFoundError:
        print(f"Error: The file {file_path} was not found.")
    except Exception as e:
        print(f"Error inspecting data file: {e}")

def process_raw_data():
    """Process TradeData2002.json and TradeData2014.json into plastic_waste_flows2.json"""
    
    # Country coordinates
    country_coords = {
        "USA": [-95.7129, 37.0902], "CAN": [-106.3468, 56.1304], "MEX": [-102.5528, 23.6345],
        "DEU": [10.4515, 51.1657], "GBR": [-3.4360, 55.3781], "FRA": [2.2137, 46.2276],
        "NLD": [5.2913, 52.1326], "BEL": [4.4699, 50.5039], "ITA": [12.5674, 42.5034],
        "ESP": [-3.7492, 40.4637], "POL": [19.1451, 51.9194], "SWE": [18.6435, 60.1282],
        "CHE": [8.2275, 46.8182], "AUT": [14.5501, 47.5162], "NOR": [8.4689, 60.4720],
        "DNK": [9.5018, 56.2639], "ROU": [24.9668, 45.9432], 
        "CHN": [104.1954, 35.8617], "JPN": [138.2529, 36.2048], "KOR": [127.7669, 35.9078],
        "MYS": [101.9758, 4.2105], "THA": [100.9925, 15.8700], "VNM": [108.2772, 14.0583],
        "IDN": [113.9213, -0.7893], "IND": [78.9629, 20.5937], "TUR": [35.2433, 38.9637],
        "HKG": [114.1095, 22.3964], "TWN": [120.9605, 23.6978], "PHL": [121.7740, 12.8797],
        "PAK": [69.3451, 30.3753], "SGP": [103.8198, 1.3521],
        "AUS": [133.7751, -25.2744], "NZL": [174.8860, -40.9006],
        "BRA": [-51.9253, -14.2350], "ARG": [-63.6167, -38.4161], "CHL": [-71.5430, -35.6751],
        "COL": [-74.2973, 4.5709], "PER": [-75.0152, -9.1900], "ECU": [-78.1834, -1.8312],
        "ZAF": [22.9375, -30.5595], "EGY": [30.8025, 26.8206], "MAR": [-7.0926, 31.7917],
        "NGA": [8.6753, 9.0820], "KEN": [37.9062, -0.0236], "GHA": [-1.0232, 7.9465],
        "TZA": [34.8888, -6.3690], "CIV": [-5.5471, 7.5400], "DZA": [2.6326, 28.1635]
    }
    
    def process_record(record):
        """Process a single UN Comtrade record"""
        try:
            # Extract fields
            year = record.get('refYear')
            source_code = record.get('reporterISO', '').strip()
            source_name = record.get('reporterDesc', '').strip()
            target_code = record.get('partnerISO', '').strip()
            target_name = record.get('partnerDesc', '').strip()
            trade_value = record.get('primaryValue')
            qty = record.get('qty')
            flow_desc = record.get('flowDesc', '')
            cmd_code = str(record.get('cmdCode', ''))
            
            # Apply filters
            if not year or not source_code or not target_code:
                return None
            if cmd_code != '3915':
                return None
            if 'export' not in flow_desc.lower():
                return None
            if not trade_value or float(trade_value) <= 0:
                return None
            if not qty or float(qty) <= 0:
                return None
            if source_code == target_code:
                return None
            if target_code in ['W00', '0'] or target_name == 'World':
                return None
            
            # Get coordinates
            source_coords = country_coords.get(source_code)
            target_coords = country_coords.get(target_code)
            
            if not source_coords or not target_coords:
                return None
            
            return {
                'year': int(year),
                'source_country': source_code,
                'source_name': source_name,
                'source_lat': source_coords[1],
                'source_lon': source_coords[0],
                'target_country': target_code,
                'target_name': target_name,
                'target_lat': target_coords[1],
                'target_lon': target_coords[0],
                'trade_value': float(trade_value),
                'weight_kg': float(qty)  # Rename qty to weight_kg
            }
        except Exception as e:
            return None
    
    # Load and process both files
    all_records = []
    
    for filename in ['TradeData2002.json', 'TradeData2014.json']:
        if os.path.exists(filename):
            print(f"Loading {filename}...")
            with open(filename, 'r') as f:
                data = json.load(f)
            print(f"  Loaded {len(data)} records")
            all_records.extend(data)
        else:
            print(f"Warning: {filename} not found")
    
    print(f"Total raw records: {len(all_records)}")
    
    # Process records
    print("Processing records...")
    processed_records = []
    skipped = 0
    
    for i, record in enumerate(all_records):
        processed = process_record(record)
        if processed:
            processed_records.append(processed)
        else:
            skipped += 1
        
        if (i + 1) % 10000 == 0:
            print(f"  Processed {i + 1}/{len(all_records)} records...")
    
    print(f"Valid records: {len(processed_records)}")
    print(f"Skipped records: {skipped}")
    
    # Group by year
    data_by_year = {}
    for record in processed_records:
        year = str(record['year'])
        if year not in data_by_year:
            data_by_year[year] = []
        data_by_year[year].append(record)
    
    # Show summary
    print("\nData by year:")
    for year in sorted(data_by_year.keys()):
        print(f"  {year}: {len(data_by_year[year])} flows")
    
    # Save processed data
    output_file = 'plastic_waste_flows2.json'
    with open(output_file, 'w') as f:
        json.dump(data_by_year, f)
    
    print(f"\n✅ Saved processed data to {output_file}")
    
    # Show sample processed record
    if processed_records:
        print("\nSample processed record:")
        print(json.dumps(processed_records[0], indent=2))
        
        # Weight statistics
        weights = [r['weight_kg'] for r in processed_records if r['weight_kg'] > 0]
        if weights:
            print(f"\nWeight statistics:")
            print(f"  Min: {min(weights)}")
            print(f"  Max: {max(weights)}")
            print(f"  Average: {sum(weights)/len(weights):.2f}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "process":
            print("Processing TradeData files...")
            process_raw_data()
        else:
            # Inspect a specific file
            inspect_data_file(command)
    else:
        # Check if we should process or inspect
        if os.path.exists("TradeData2002.json") and os.path.exists("TradeData2014.json"):
            print("Found TradeData files. Would you like to:")
            print("1. Process them into plastic_waste_flows2.json")
            print("2. Inspect existing plastic_waste_flows2.json")
            
            choice = input("Enter 1 or 2: ").strip()
            if choice == "1":
                process_raw_data()
            else:
                file_path = "plastic_waste_flows2.json"
                if not os.path.exists(file_path):
                    file_path = os.path.join("data", file_path)
                inspect_data_file(file_path)
        else:
            # Default inspection
            file_path = "plastic_waste_flows2.json"
            if not os.path.exists(file_path):
                file_path = os.path.join("data", file_path)
            inspect_data_file(file_path)
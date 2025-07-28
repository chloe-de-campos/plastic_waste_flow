import json
import os
from collections import defaultdict

def analyze_plastic_waste_data(data):
    """
    Analyze plastic waste trade data to calculate summary statistics across ALL data
    """
    
    print("✅ Data loaded successfully!")
    print(f"\nData structure overview:")
    print(f"Years available: {list(data.keys())}")
    
    # Show sample of first year's data
    first_year = list(data.keys())[0]
    first_flows = data[first_year]
    print(f"Sample from {first_year}: {len(first_flows)} flows")
    if len(first_flows) > 0:
        print("Sample flow fields:", list(first_flows[0].keys()))
    
    # Initialize counters
    total_weight_kg = 0
    total_value_usd = 0
    all_countries = set()
    yearly_totals = {}
    total_flows = 0
    
    # Process each year
    for year, flows in data.items():
        print(f"\n📅 Processing year {year}: {len(flows)} trade flows")
        
        year_weight = 0
        year_value = 0
        year_countries = set()
        
        for i, flow in enumerate(flows):
            # Extract weight (in kg)
            weight = flow.get('weight_kg', 0) or 0
            
            # Extract value (in USD)
            value = flow.get('trade_value', 0) or 0
            
            # Add countries
            if flow.get('source_country'):
                year_countries.add(flow['source_country'])
                all_countries.add(flow['source_country'])
            if flow.get('target_country'):
                year_countries.add(flow['target_country'])
                all_countries.add(flow['target_country'])
            
            year_weight += weight
            year_value += value
        
        yearly_totals[year] = {
            'weight_kg': year_weight,
            'weight_tonnes': year_weight / 1000,
            'weight_million_tonnes': year_weight / 1_000_000_000,
            'value_usd': year_value,
            'value_million_usd': year_value / 1_000_000,
            'value_billion_usd': year_value / 1_000_000_000,
            'countries': len(year_countries),
            'flows': len(flows)
        }
        
        total_weight_kg += year_weight
        total_value_usd += year_value
        total_flows += len(flows)
        
        print(f"  ✅ Weight: {year_weight/1_000_000:.0f}K tonnes")
        print(f"  ✅ Value: ${year_value/1_000_000:.1f}M")
        print(f"  ✅ Countries: {len(year_countries)}")
    
    # Calculate OVERALL averages across ALL data
    num_years = len(yearly_totals)
    avg_weight_million_tonnes = (total_weight_kg / 1_000_000_000) / num_years
    avg_value_billion = (total_value_usd / 1_000_000_000) / num_years
    
    print("\n" + "="*70)
    print("📊 COMPLETE DATASET STATISTICS (ALL YEARS)")
    print("="*70)
    
    print(f"\n🎯 OVERALL AVERAGES ({num_years} years: {min(yearly_totals.keys())}-{max(yearly_totals.keys())})")
    print(f"   Average tonnes traded annually: {avg_weight_million_tonnes:.1f}M tonnes")
    print(f"   Average market value annually: ${avg_value_billion:.1f}B")
    print(f"   Total countries involved: {len(all_countries)} countries")
    print(f"   Total trade flows: {total_flows:,} flows")
    
    print(f"\n📈 GRAND TOTALS (Entire dataset)")
    print(f"   Total Weight: {total_weight_kg/1_000_000_000:.1f}M tonnes")
    print(f"   Total Value: ${total_value_usd/1_000_000_000:.1f}B")
    print(f"   Data span: {num_years} years")
    
    # Show yearly breakdown for context
    print(f"\n📅 YEAR-BY-YEAR BREAKDOWN")
    for year in sorted(yearly_totals.keys()):
        stats = yearly_totals[year]
        print(f"   {year}: {stats['weight_million_tonnes']:.2f}M tonnes, ${stats['value_billion_usd']:.2f}B, {stats['countries']} countries")
    
    # Find peak and low years
    peak_weight_year = max(yearly_totals.keys(), key=lambda y: yearly_totals[y]['weight_kg'])
    low_weight_year = min(yearly_totals.keys(), key=lambda y: yearly_totals[y]['weight_kg'])
    peak_value_year = max(yearly_totals.keys(), key=lambda y: yearly_totals[y]['value_usd'])
    peak_countries_year = max(yearly_totals.keys(), key=lambda y: yearly_totals[y]['countries'])
    
    print(f"\n🏆 DATASET EXTREMES")
    print(f"   Highest weight year: {peak_weight_year} ({yearly_totals[peak_weight_year]['weight_million_tonnes']:.2f}M tonnes)")
    print(f"   Lowest weight year: {low_weight_year} ({yearly_totals[low_weight_year]['weight_million_tonnes']:.2f}M tonnes)")
    print(f"   Highest value year: {peak_value_year} (${yearly_totals[peak_value_year]['value_billion_usd']:.2f}B)")
    print(f"   Most countries year: {peak_countries_year} ({yearly_totals[peak_countries_year]['countries']} countries)")
    
    print(f"\n✨ HERO SECTION STATS (Based on ALL data)")
    print("="*50)
    print(f"   {avg_weight_million_tonnes:.0f}M")
    print(f"   Tonnes traded annually")
    print(f"   {len(all_countries)}+")
    print(f"   Countries involved")  
    print(f"   ${avg_value_billion:.0f}B")
    print(f"   Market value")
    print("="*50)
    
    # Additional insights
    print(f"\n🔍 ADDITIONAL INSIGHTS")
    growth_rate = ((yearly_totals[max(yearly_totals.keys())]['weight_kg'] / yearly_totals[min(yearly_totals.keys())]['weight_kg']) - 1) * 100
    print(f"   Growth from {min(yearly_totals.keys())} to {max(yearly_totals.keys())}: {growth_rate:.1f}%")
    print(f"   Average trade flow size: {(total_weight_kg/total_flows)/1000:.0f} tonnes per flow")
    print(f"   Average value per tonne: ${(total_value_usd/total_weight_kg)*1000:.0f} per tonne")
    
    return {
        'dataset_span': f"{min(yearly_totals.keys())}-{max(yearly_totals.keys())}",
        'total_years': num_years,
        'avg_annual_tonnes_million': avg_weight_million_tonnes,
        'avg_annual_value_billion': avg_value_billion,
        'total_countries': len(all_countries),
        'total_weight_million_tonnes': total_weight_kg/1_000_000_000,
        'total_value_billion': total_value_usd/1_000_000_000,
        'total_flows': total_flows,
        'yearly_totals': yearly_totals,
        'peak_weight_year': peak_weight_year,
        'peak_value_year': peak_value_year,
        'growth_rate_percent': growth_rate
    }

def main():
    """
    Main function to load and analyze the plastic waste data
    """
    print("🔬 ANALYZING ALL PLASTIC WASTE TRADE DATA")
    print("="*60)
    
    # Try different possible file locations
    possible_paths = [
        'plastic_waste_flows2.json',
        'data/plastic_waste_flows2.json',
        './plastic_waste_flows2.json',
        '../plastic_waste_flows2.json'
    ]
    
    data = None
    file_path = None
    
    for path in possible_paths:
        if os.path.exists(path):
            file_path = path
            print(f"📁 Found data file: {path}")
            break
    
    if not file_path:
        print("❌ Could not find plastic_waste_flows2.json")
        print("Please make sure the file is in one of these locations:")
        for path in possible_paths:
            print(f"   - {path}")
        return
    
    # Load the data
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"✅ Successfully loaded {file_path}")
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing JSON: {e}")
        return
    except Exception as e:
        print(f"❌ Error loading file: {e}")
        return
    
    # Run the analysis
    results = analyze_plastic_waste_data(data)
    
    if results:
        print(f"\n🎉 Analysis complete!")
        
        # Print the final hero stats clearly
        print(f"\n🎯 FINAL DASHBOARD STATS:")
        print(f"   📊 {results['avg_annual_tonnes_million']:.0f}M tonnes traded annually")
        print(f"   🌍 {results['total_countries']} countries involved")
        print(f"   💰 ${results['avg_annual_value_billion']:.0f}B market value")
        print(f"   📅 Based on {results['total_years']} years of data ({results['dataset_span']})")
        
        # Optional: Save results to a file
        try:
            with open('analysis_results.json', 'w') as f:
                json.dump(results, f, indent=2)
            print(f"💾 Results saved to analysis_results.json")
        except Exception as e:
            print(f"⚠️  Could not save results file: {e}")

if __name__ == "__main__":
    main()
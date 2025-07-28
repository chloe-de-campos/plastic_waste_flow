cat > plastic_waste_flow/README.md << 'EOF'
# Global Plastic Waste Trade Flow Visualization

An interactive visualization showing the flow of plastic waste between countries from 2015 to 2023.

## Project Overview

This visualization maps the global trade of plastic waste, showing how plastic waste moves from developed nations to developing countries. It highlights environmental justice issues and the global impact of plastic pollution.

## Data Source

The visualization uses data from the UN Comtrade Database, focusing on commodity code 3915 (plastic waste and scrap). The data shows bilateral trade flows between selected major countries involved in the plastic waste trade.

## Features

- Interactive world map showing countries
- Animated flow arrows representing trade volume
- Year slider to view changes over time (2015-2023)
- Tooltips with detailed information on hover
- Responsive design for different screen sizes

## Technical Implementation

- Built with D3.js v7
- Uses TopoJSON for map rendering
- Implements smooth transitions and interactions
- Responsive SVG visualization
- Minimal, clean design approach

## Setup and Usage

1. Clone this repository
2. Run a local server (e.g., `python -m http.server`)
3. Open your browser to `http://localhost:8000`

## Data Processing

The `data/fetch_comtrade_data.py` script fetches and processes data from the UN Comtrade API. To update the data:

1. Install required Python packages: `pip install requests pandas`
2. Run the script: `python data/fetch_comtrade_data.py`
3. The script will generate CSV and JSON files in the data directory

## License

[Your license information here]

## Author

[Your name and contact information]
EOF



## TODO :

add other materials 
https://unstats.un.org/unsd/classifications/Econ/Detail/EN/32/3915

https://unstats.un.org/unsd/classifications/Econ/Detail/EN/32/4004

https://unstats.un.org/unsd/classifications/Econ/Detail/EN/32/4707

https://unstats.un.org/unsd/classifications/Econ/Detail/EN/32/5202

https://unstats.un.org/unsd/classifications/Econ/Detail/EN/32/5505

https://unstats.un.org/unsd/classifications/Econ/Detail/EN/32/8548

https://comtradeplus.un.org/TradeFlow?Frequency=A&Flows=X&CommodityCodes=3915&Partners=all&Reporters=all&period=2024&AggregateBy=none&BreakdownMode=plus


add country wealth

figure out why us/canada counts for so much. 

https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.weforum.org%2Fstories%2F2023%2F03%2Fcharted-the-flow-of-global-plastic-waste%2F&psig=AOvVaw05LUwZNR6C6FUGYx8hf0hF&ust=1753391745973000&source=images&cd=vfe&opi=89978449&ved=0CBYQjRxqFwoTCMiqvbPz044DFQAAAAAdAAAAABAK
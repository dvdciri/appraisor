# Estimo - UK Property Investment Analysis Tool

A Next.js application for analyzing UK investment properties with detailed property insights.

## Features

- Property search by address and postcode
- Comprehensive property details display
- Dark theme with minimal design
- Key property metrics highlighted (value, rent, tenure, bedrooms, bathrooms, EPC rating, size)
- Organized sections for different property information categories

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Enter a property address and postcode in the form
2. Click "Analyze Property" to fetch property data
3. View comprehensive property details organized in sections:
   - Property Overview (highlighted main info)
   - Property Details (basic information and location)
   - Financial Information (council tax and ownership)
   - Environmental Information (energy performance and flood risk)
   - Nearby Listings (if available)

## API

The app includes a single API endpoint:
- `POST /api/property` - Returns property data based on address and postcode input

Currently, the API returns the same sample data regardless of input for demonstration purposes.

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Dark theme design

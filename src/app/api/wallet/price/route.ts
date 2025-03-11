import { NextResponse } from 'next/server';

interface PriceResponse {
  data: {
    [key: string]: {
      id: string;
      type: string;
      price: string;
    };
  };
  timeTaken: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mintAddress = searchParams.get('mintAddress');

    if (!mintAddress) {
      return NextResponse.json(
        { error: 'Mint address is required' },
        { status: 400 },
      );
    }

    const baseUrl = 'https://api.jup.ag/price/v2';
    const response = await fetch(`${baseUrl}?ids=${mintAddress}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as PriceResponse;

    if (!data.data || !data.data[mintAddress]) {
      return NextResponse.json(
        { error: `No price data found for token: ${mintAddress}` },
        { status: 404 },
      );
    }

    const price = parseFloat(data.data[mintAddress].price);

    return NextResponse.json({ price });
  } catch (error) {
    console.error('Error fetching token price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token price' },
      { status: 500 },
    );
  }
}

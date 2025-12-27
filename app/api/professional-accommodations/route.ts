// app/api/professional-accommodations/route.ts - UPDATED VERSION
import { type NextRequest, NextResponse } from "next/server"



function generateBookingUrl(city: string, country: string, checkin?: string, checkout?: string): string {
  const baseUrl = "https://www.booking.com/searchresults.html"
  const params = new URLSearchParams({
    ss: `${city}, ${country}`,
    lang: "en-us",
    sb: "1",
    src_elem: "sb",
    src: "index",
    dest_type: "city",
    group_adults: "1",
    no_rooms: "1",
    group_children: "0",
  })

  if (checkin) {
    params.append("checkin", checkin)
  }
  if (checkout) {
    params.append("checkout", checkout)
  }

  return `${baseUrl}?${params.toString()}`
}

function generateAirbnbUrl(city: string, country: string, checkin?: string, checkout?: string): string {
  const location = encodeURIComponent(`${city}, ${country}`)
  const url = `https://www.airbnb.com/s/${location}/homes`

  const params = new URLSearchParams()
  if (checkin) params.append("checkin", checkin)
  if (checkout) params.append("checkout", checkout)
  params.append("adults", "1")

  const paramString = params.toString()
  return paramString ? `${url}?${paramString}` : url
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get("city")
    const country = searchParams.get("country")
    const checkin = searchParams.get("checkin") || undefined
    const checkout = searchParams.get("checkout") || undefined

    if (!city || !country) {
      return NextResponse.json({ success: false, error: "City and country parameters are required" }, { status: 400 })
    }

    const cityName = city.split(",")[0].trim()

    console.log(`[v0] Generating accommodation links for ${cityName}, ${country}`)

    const bookingUrl = generateBookingUrl(cityName, country, checkin, checkout)
    const airbnbUrl = generateAirbnbUrl(cityName, country, checkin, checkout)

    const accommodations = [
      {
        id: "booking-hotels",
        name: `Hotels near ${cityName}`,
        type: "Hotels & Apartments",
        description: `Find hotels, apartments, and guesthouses in ${cityName}, ${country}. Compare prices and read reviews from verified guests.`,
        provider: "Booking.com",
        url: bookingUrl,
        features: ["Free Cancellation Available", "Price Match Guarantee", "24/7 Customer Support"],
        rating: 4.5,
        priceRange: "Various price ranges available",
      },
      {
        id: "airbnb-stays",
        name: `Airbnb in ${cityName}`,
        type: "Homes & Apartments",
        description: `Discover unique stays and local experiences in ${cityName}, ${country}. From private rooms to entire homes.`,
        provider: "Airbnb",
        url: airbnbUrl,
        features: ["Unique Local Stays", "Self Check-in Options", "Long-term Discounts"],
        rating: 4.4,
        priceRange: "Various price ranges available",
      },
    ]

    return NextResponse.json({
      success: true,
      city: cityName,
      country,
      accommodations,
      bookingUrl,
      airbnbUrl,
      message: `Found accommodation options in ${cityName}, ${country}`,
    })
  } catch (error) {
    console.error("[v0] Error in professional-accommodations route:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to generate accommodation links"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    )
  }
}

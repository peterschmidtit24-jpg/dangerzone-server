const router = require("express").Router()
const geocodeCache = new Map()

function normalizePhotonFeature(feature) {
  const coordinates = feature?.geometry?.coordinates
  const properties = feature?.properties || {}
  const lng = coordinates?.[0]
  const lat = coordinates?.[1]

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  const displayParts = [
    properties.name,
    properties.street,
    properties.housenumber,
    properties.district,
    properties.city,
    properties.postcode,
    properties.country,
  ].filter(Boolean)

  return {
    display_name: [...new Set(displayParts)].join(", "),
    lat: String(lat),
    lon: String(lng),
  }
}

async function searchNominatim(query) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent": "dangerzone-local-dev/1.0",
      },
    },
  )

  if (!response.ok) {
    return null
  }

  return response.json()
}

async function searchPhoton(query) {
  const response = await fetch(
    `https://photon.komoot.io/api/?limit=1&lang=de&q=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent": "dangerzone-local-dev/1.0",
      },
    },
  )

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  const normalizedFeature = normalizePhotonFeature(data.features?.[0])

  return normalizedFeature ? [normalizedFeature] : []
}

router.get("/geocode", async (req, res, next) => {
  try {
    const query = String(req.query.q || "").trim()

    if (!query) {
      res.status(400).json({ errorMessage: "Address query is required" })
      return
    }

    const cacheKey = query.toLowerCase()
    if (geocodeCache.has(cacheKey)) {
      res.status(200).json(geocodeCache.get(cacheKey))
      return
    }

    const nominatimResults = await searchNominatim(query)
    const results = nominatimResults?.length
      ? nominatimResults
      : await searchPhoton(query)

    if (!results) {
      res.status(502).json({ errorMessage: "Could not search for this address." })
      return
    }

    geocodeCache.set(cacheKey, results)
    res.status(200).json(results)
  } catch (error) {
    next(error)
  }
})

module.exports = router

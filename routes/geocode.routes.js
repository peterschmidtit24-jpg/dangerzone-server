const router = require("express").Router()
const geocodeCache = new Map()
const berlinCenter = {
  lat: 52.52,
  lng: 13.405,
}

function getDistanceScore(result) {
  const lat = Number.parseFloat(result?.lat)
  const lng = Number.parseFloat(result?.lon)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Number.POSITIVE_INFINITY
  }

  return Math.abs(lat - berlinCenter.lat) + Math.abs(lng - berlinCenter.lng)
}

function sortResultsByBerlinCenter(results) {
  return [...results].sort((firstResult, secondResult) => (
    getDistanceScore(firstResult) - getDistanceScore(secondResult)
  ))
}

function normalizeStreetText(value) {
  return String(value || "")
    .toLowerCase()
    .replaceAll("ß", "ss")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replace(/\bstrase\b/g, "strasse")
    .replace(/([a-z]+)trasse\b/g, "$1strasse")
    .replace(/([a-z]+)str\b/g, "$1strasse")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function getRequestedStreetStem(query) {
  const addressPart = normalizeStreetText(query.split(",")[0])
  const withoutHouseNumber = addressPart
    .replace(/\b\d+[a-z]?\b/g, "")
    .replace(/\s+/g, " ")
    .trim()

  return withoutHouseNumber
    .replace(/\bstrasse\b/g, "")
    .replace(/\bstreet\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function resultMatchesRequestedStreet(result, query) {
  const requestedStreetStem = getRequestedStreetStem(query)

  if (requestedStreetStem.length < 4) {
    return true
  }

  const normalizedDisplayName = normalizeStreetText(result?.display_name)
  return normalizedDisplayName.includes(requestedStreetStem)
}

function filterResultsByRequestedStreet(results, query) {
  const matchingResults = results.filter((result) => resultMatchesRequestedStreet(result, query))
  return matchingResults.length ? matchingResults : []
}

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
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent": "dangerzone-local-dev/1.0",
      },
    },
  )

  if (!response.ok) {
    return null
  }

  const results = await response.json()
  return filterResultsByRequestedStreet(sortResultsByBerlinCenter(results), query)
}

async function searchPhoton(query) {
  const response = await fetch(
    `https://photon.komoot.io/api/?limit=5&lang=de&q=${encodeURIComponent(query)}`,
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
  const normalizedFeatures = data.features
    ?.map(normalizePhotonFeature)
    .filter(Boolean) || []
  const matchingFeatures = filterResultsByRequestedStreet(normalizedFeatures, query)

  return matchingFeatures.length ? sortResultsByBerlinCenter(matchingFeatures) : []
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

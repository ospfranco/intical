import {DateTime} from 'luxon'

export async function fetchSunriseSunset() {
  let res = await fetch(`https://api.sunrise-sunset.org/json?lat=48.1351&lng=11.5820&date=today&formatted=0`)
  let json = await res.json()
  return {sunrise: DateTime.fromISO(json.results.sunrise), sunset: DateTime.fromISO(json.results.sunset)}
}
import { CityType } from "@/app/context";
import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";


export async function GET(request: NextApiRequest, response: NextApiResponse) {
    const googleMapsAPIKey = process.env.GOOGLE_MAPS_API_KEY;

    // Send POST Request to the Google Maps Geolocation API
    const Geolocation = await axios.post(`https://www.googleapis.com/geolocation/v1/geolocate?key=${googleMapsAPIKey}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            console.log(`error: `, error);
            return {
                "location": {
                    "lat": 34.0021759,
                    "lng": -6.738705
                },
                "accuracy": 15102.529191010317
            };
        });

    const latitude = Geolocation.location.lat;
    const longitude = Geolocation.location.lng;

    const Cities: CityType[] = await axios
        .get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${process.env.GOOGLE_MAPS_API_KEY}&location=${latitude},${longitude}&radius=5000`)
        .then(async (response) => {
            const Predictions = response.data.results.filter((prediction: any) => {
                return prediction.types.includes('locality') || prediction.types.includes('political') || prediction.types.includes('postal_code');
            });

            // Wrap the map function in another async function to wait for the promises to resolve before accessing the Cities array.
            async function fetchCityDetails(prediction: any) {
                const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?key=${process.env.GOOGLE_MAPS_API_KEY || "AIzaSyCQe29u1Q8RryIv57m22J0XVu6CygHa8Q4"}&place_id=${prediction.place_id}`);
                const json = await response.json();

                const { lat, lng } = json.result.geometry.location;
                const countryCode = json
                    .result
                    .address_components
                    .find((component: {
                        types: string | string[];
                    }) => component.types.includes('country'))
                    .short_name;


                // Country Code to Country Name

                async function countryCodeToName(countryCode: string) {
                    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GOOGLE_MAPS_API_KEY}&components=country:${countryCode}`)
                        .then((response) => {
                            return response.data;
                        })
                        .catch((err) => {
                            console.log(err)
                            return "Unknown"
                        });


                    const countryName = typeof response === "string" ? response : response.results[0].address_components[0].long_name;

                    return countryName;
                }

                // Get the city's country from the address_components
                const cityCountry = await countryCodeToName(countryCode);

                return {
                    id: prediction.place_id,
                    mainText: prediction.name,
                    secondaryText: cityCountry,
                    countryCode: countryCode,
                    latitude: lat,
                    longitude: lng,
                };
            }

            const Cities = await Promise.all(Predictions.map(fetchCityDetails));

            return Cities;
        })
        .catch((error) => {
            console.log(`error: `, error);
            return [];
        });



    return new Response(JSON.stringify(Cities), {
        headers: {
            'content-type': 'application/json;charset=UTF-8',
        },
    });
}

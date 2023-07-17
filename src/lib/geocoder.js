import Geocodio from 'geocodio-library-node';

export const geocoder = new Geocodio(process.env.GEOCODIO_API_KEY);

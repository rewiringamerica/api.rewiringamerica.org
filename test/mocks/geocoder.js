import fs from 'fs';

const LMI_GEOCODE_FIXTURE = JSON.parse(fs.readFileSync('./test/fixtures/lmi-communities-test-address.json', 'utf-8'));

class MockGeocoder {
  geocode(address, fields) {
    if (address == '4986 Zuni St, Denver, CO 80221' && fields.length == 1 && fields[0] == 'census2010') {
      return new Promise((resolve, _) => {
        return resolve(LMI_GEOCODE_FIXTURE);
      });
    } else {
      throw new Error('MockGeocoder called with unusable address or fields');
    }
  }
}

export const geocoder = new MockGeocoder();

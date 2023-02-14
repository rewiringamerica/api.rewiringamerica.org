import LMI_GEOCODE_FIXTURE from '../fixtures/lmi-communities-test-address.json' assert { type: 'json' };

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

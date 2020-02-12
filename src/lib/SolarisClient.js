/* eslint-disable prettier/prettier */

//
// Warning: this file is auto-generated.
//

export default class SolarisClient {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  getHealthzUrl() {
    return (this.endpoint + '/healthz');
  }

  async getHealthz() {
    return await fetch(this.getHealthzUrl(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  getUrl() {
    return (this.endpoint + '/');
  }

  async get() {
    return await fetch(this.getUrl(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  getImagesUrl() {
    return (this.endpoint + '/images');
  }

  async getImages() {
    return await fetch(this.getImagesUrl(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  getShipsUrl() {
    return (this.endpoint + '/ships');
  }

  async getShips() {
    return await fetch(this.getShipsUrl(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  getShipsByPatpUrl(patp) {
    return (this.endpoint + '/ships/' + encodeURIComponent(patp) + '');
  }

  async getShipsByPatp(patp) {
    return await fetch(this.getShipsByPatpUrl(patp), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  getShipsByPatpDetailsUrl(patp) {
    return (this.endpoint + '/ships/' + encodeURIComponent(patp) + '/details');
  }

  async getShipsByPatpDetails(patp) {
    return await fetch(this.getShipsByPatpDetailsUrl(patp), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  postShipsUrl() {
    return (this.endpoint + '/ships');
  }

  async postShips(data) {
    return await fetch(this.postShipsUrl(), {
      method: 'POST',
      cache: 'no-cache',
      body: JSON.stringify({...data, debug: true}),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

}

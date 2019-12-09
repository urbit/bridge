/* eslint-disable prettier/prettier */

//
// Warning: this file is auto-generated.
//

export default class SolarisClient {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async getHealthz() {
    return await fetch(this.endpoint + '/healthz', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async get() {
    return await fetch(this.endpoint + '/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async getImages() {
    return await fetch(this.endpoint + '/images', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async getShips() {
    return await fetch(this.endpoint + '/ships', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async getShipsByPatp(patp) {
    return await fetch(this.endpoint + '/ships/' + encodeURIComponent(patp) + '', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async getShipsByPatpDetails(patp) {
    return await fetch(this.endpoint + '/ships/' + encodeURIComponent(patp) + '/details', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async getShipsByPatpEvents(patp) {
    return await fetch(this.endpoint + '/ships/' + encodeURIComponent(patp) + '/events', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async postShips(data) {
    return await fetch(this.endpoint + '/ships', {
      method: 'POST',
      cache: 'no-cache',
      body: JSON.stringify(data),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

}

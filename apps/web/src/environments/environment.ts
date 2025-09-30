export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  keycloak: {
    url: 'http://localhost:8080',
    realm: 'ifrs15',
    clientId: 'ifrs15-web'
  },
  features: {
    enableAnalytics: false,
    enableServiceWorker: false,
    enableLogging: true
  }
};

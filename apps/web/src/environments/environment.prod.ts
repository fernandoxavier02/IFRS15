export const environment = {
  production: true,
  apiUrl: 'https://ifrs15-api.onrender.com/api/v1',
  keycloak: {
    url: 'https://ifrs15-keycloak.onrender.com',
    realm: 'ifrs15',
    clientId: 'ifrs15-web'
  },
  features: {
    enableAnalytics: true,
    enableServiceWorker: true,
    enableLogging: false
  }
};

import config from '../../config';

export const connection = {
  namespace: config.TEMPORAL_NAMESPACE,
  connection: config.TEMPORAL_USE_TLS
    ? {
        address: config.TEMPORAL_ADDRESS,
        tls: {
          clientCertPair: {
            crt: Buffer.from(config.TEMPORAL_CERT_PEM, 'base64'),
            key: Buffer.from(config.TEMPORAL_CERT_KEY, 'base64'),
          },
        },
      }
    : {
        address: config.TEMPORAL_ADDRESS,
        tls: false,
      },
};

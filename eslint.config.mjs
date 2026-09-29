import next from 'eslint-config-next';

const config = [...next, { ignores: ['.old/**', 'public/legacy/**', '.next/**'] }];
export default config;

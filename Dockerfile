FROM node:22-alpine

WORKDIR /app
RUN apk add --no-cache bash tini libc6-compat

# 1) Manifests primeiro p/ cache
COPY package.json package-lock.json* ./

# 2) Instalação: tenta ci; se lock estiver desatualizado, cai pro install
RUN (npm ci --include=dev) || (echo "npm ci failed; falling back to npm install" && npm install --include=dev)

# 3) Copia o resto do código
COPY . .

# 4) Garante Radix Tooltip/Portal mesmo que o lock ainda não tenha sido commitado
RUN npm install @radix-ui/react-tooltip @radix-ui/react-portal --no-save

# 5) Build do front (gera dist/public)
RUN npm run build

# 6) Entrypoint para migrations + start
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENV NODE_ENV=production
EXPOSE 5000
ENTRYPOINT ["/sbin/tini","--"]
CMD ["/usr/local/bin/entrypoint.sh"]

FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache bash tini libc6-compat

# 1) instala deps conforme lock (para cache layer eficiente)
COPY package.json package-lock.json* ./
RUN npm ci --include=dev

# 2) copia o código
COPY . .

# 3) garante que tooltip/portal existem MESMO se o lock estiver desatualizado
# (não altera seu package-lock no repositório)
RUN npm i @radix-ui/react-tooltip @radix-ui/react-portal --no-save

# 4) build do front (gera dist/public)
RUN npm run build

# 5) entrypoint para migrations + start
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENV NODE_ENV=production
EXPOSE 5000

ENTRYPOINT ["/sbin/tini","--"]
CMD ["/usr/local/bin/entrypoint.sh"]

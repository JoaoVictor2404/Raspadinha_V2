# ---- Base (single-stage para simplificar, inclui devDeps pois usamos tsx no runtime) ----
    FROM node:22-alpine

    WORKDIR /app
    
    # Libs úteis
    RUN apk add --no-cache bash tini libc6-compat
    
    # Copia manifestos primeiro para cache
    COPY package.json package-lock.json* ./
    
    # Instala com devDependencies (precisamos do tsx e drizzle-kit)
    RUN npm ci --include=dev
    
    # Copia resto do código
    COPY . .
    
    # (Opcional) Vite config "inteligente" deve estar em ./vite.config.ts
    # Faz build do front (gera dist/public)
    RUN npm run build
    
    # Script de entrada
    COPY entrypoint.sh /usr/local/bin/entrypoint.sh
    RUN chmod +x /usr/local/bin/entrypoint.sh
    
    ENV NODE_ENV=production
    EXPOSE 5000
    
    # tini evita zombies; entrypoint roda migração e inicia app
    ENTRYPOINT ["/sbin/tini","--"]
    CMD ["/usr/local/bin/entrypoint.sh"]
    
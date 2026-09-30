# ============================================================
# CourseMate – Scraper Backend Production Dockerfile
# Base: Microsoft Playwright image (includes all Chromium deps)
# ============================================================
FROM mcr.microsoft.com/playwright:v1.45.0-focal

LABEL maintainer="CourseMate <dev@coursemate.ug>"
LABEL description="CourseMate scraper/API backend – Node + Playwright"

# -- 1. Environment ------------------------------------------
ENV NODE_ENV=production
ENV PORT=3001
# Inject at runtime via: docker run -e GEMINI_API_KEY=... -e SUPABASE_URL=...
# ENV GEMINI_API_KEY=
# ENV SUPABASE_URL=
# ENV SUPABASE_SERVICE_ROLE_KEY=
# ENV ALLOWED_ORIGIN=https://coursemate-ug.vercel.app

WORKDIR /app

# -- 2. Install dependencies ----------------------------------
COPY package.json package-lock.json ./
RUN npm ci --include=dev
RUN npx playwright install chromium --with-deps

# -- 3. Copy source & compile ---------------------------------
COPY tsconfig.json ./
COPY server.ts ./
COPY src/ ./src/
COPY public/ ./public/

RUN npx esbuild server.ts \
      --bundle \
      --platform=node \
      --format=esm \
      --outfile=dist/server.js \
      --external:playwright \
      --external:@supabase/supabase-js \
      --external:@google/genai \
      --external:express \
      --external:dotenv \
      --external:cheerio \
      --external:canvas-confetti \
      "--banner:js=import { createRequire } from 'module'; const require = createRequire(import.meta.url);"

RUN mkdir -p dist/src/adapters && cp -r src/adapters/. dist/src/adapters/ 2>/dev/null || true
RUN cp src/scraper.js dist/src/scraper.js 2>/dev/null || true

# -- 4. Prune dev dependencies ---------------------------------
RUN npm prune --omit=dev

# -- 5. Expose & start -----------------------------------------
EXPOSE 3001
CMD ["node", "dist/server.js"]

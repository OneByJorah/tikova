# syntax=docker/dockerfile:1
# tikova demo image: Node static server for the theme preview + /healthz.
# The production product is the theme itself (install.sh into an osTicket
# 1.18.x upload dir) — this image exists so the preview can be demoed and
# screenshotted with one command.
# Tip: once you have verified a base image, pin it by digest (image@sha256:...).
# Dependabot's docker ecosystem keeps tags/digests current.

FROM node:26-alpine
ENV NODE_ENV=production PORT=8080
WORKDIR /app
COPY --chown=node:node app/server.js ./server.js
COPY --chown=node:node preview/ ./preview/
COPY --chown=node:node theme/ ./theme/
USER 1000
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:8080/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "server.js"]
